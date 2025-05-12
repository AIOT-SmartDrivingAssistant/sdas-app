import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../components/Home/Services.module.css';
import { useUserContext } from '../hooks/UserContext.jsx';
import { IOTServices } from '../utils/CommonFields.jsx';
import { handleRefreshToken } from '../utils/helpers.js';

function Services() {
  const navigate = useNavigate();
  const { servicesState, setServicesState, addActionToHistory, clearUserContext } = useUserContext();
  const [isLoading, setIsLoading] = useState({
    air_cond_service: false,
    drowsiness_service: false,
    headlight_service: false,
    dist_service: false,
    system: false,
  });
  const [error, setError] = useState(null);

  const serviceModes = {
    on: 'on',
    off: 'off',
  };

  const serviceDisplayNames = {
    [IOTServices.air_cond_service]: { title: 'Air Conditioning', description: 'Automatic air conditioning' },
    [IOTServices.drowsiness_service]: { title: 'Driver Monitoring', description: "Check the driver's status" },
    [IOTServices.headlight_service]: { title: 'Smart Headlights', description: "Adjust light when it's dark" },
    [IOTServices.dist_service]: { title: 'Distance', description: 'Distance between objects' },
  };

  const isSystemOn = Object.values(servicesState).some((state) => state === serviceModes.on);

  const handleToggleChange = async (serviceType, value, retry = true) => {
    if (isLoading[serviceType]) return;

    const newValue = value ? serviceModes.on : serviceModes.off;
    console.log(`Toggling ${serviceType} to ${newValue}`);
    setIsLoading((prev) => ({ ...prev, [serviceType]: true }));
    setError(null);

    const prevState = { ...servicesState };
    const newServicesState = { ...servicesState, [serviceType]: newValue };

    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/iot/service`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service_type: serviceType, value: newValue }),
      });

      if (response.status === 401 && retry) {
        const refreshed = await handleRefreshToken(navigate, clearUserContext);
        if (refreshed) {
          return handleToggleChange(serviceType, value, false);
        }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Service response:', data);

      setServicesState(newServicesState);
      console.log(`Service ${serviceType} updated to ${newValue}`);
      addActionToHistory('service_toggle', {
        serviceType,
        value: newValue,
        status: 'success',
      });
    } catch (error) {
      console.error('Error updating service:', error);
      const errorMessage = error.message.includes('401')
        ? 'Unauthorized access. Please log in again.'
        : error.message.includes('422')
        ? 'Invalid request. Please try again.'
        : error.message.includes('429')
        ? 'Too many requests. Please try again later.'
        : 'Failed to update service. Please try again later.';
      setError(errorMessage);
      setServicesState(prevState);
      addActionToHistory('service_toggle', {
        serviceType,
        value: newValue,
        status: 'failed',
        error: errorMessage,
      });
    } finally {
      setIsLoading((prev) => ({ ...prev, [serviceType]: false }));
    }
  };

  const handleSystemToggle = async (value, retry = true) => {
    if (isLoading['system']) return;

    const command = value ? 'on' : 'off';
    console.log(`Turning ${command} the system`);
    setIsLoading((prev) => ({ ...prev, system: true }));
    setError(null);

    const prevState = { ...servicesState };
    const newServicesState = Object.fromEntries(
      Object.keys(servicesState).map((key) => [key, value ? serviceModes.on : serviceModes.off])
    );

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/iot/${command}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.status === 401 && retry) {
        const refreshed = await handleRefreshToken(navigate, clearUserContext);
        if (refreshed) {
          return handleSystemToggle(value, false);
        }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(`System turned ${command}:`, data);

      setServicesState(newServicesState);
      addActionToHistory('system_toggle', {
        command,
        status: 'success',
      });
    } catch (error) {
      console.error(`Error turning ${command} the system:`, error);
      const errorMessage = error.message.includes('401')
        ? 'Unauthorized access. Please log in again.'
        : error.message.includes('400')
        ? 'Invalid request. Please try again.'
        : error.message.includes('429')
        ? 'Too many requests. Please try again later.'
        : error.name === 'AbortError'
        ? 'Request timed out. Please try again.'
        : 'Failed to update system state. Please try again later.';
      setError(errorMessage);
      setServicesState(prevState);
      addActionToHistory('system_toggle', {
        command,
        status: 'failed',
        error: errorMessage,
      });
    } finally {
      setIsLoading((prev) => ({ ...prev, system: false }));
    }
  };

  const renderServiceToggle = (serviceType) => {
    const displayInfo = serviceDisplayNames[serviceType];
    console.log(`Rendering ${serviceType}, checked: ${servicesState[serviceType]}`);

    return (
      <div key={serviceType} className={[styles.servicesToggle, 'form-check form-switch mb-3'].join(' ')}>
        <label
          className={[styles.servicesToggleLabel, 'form-check-label'].join(' ')}
          role="switch"
          htmlFor={`${serviceType}Toggle`}
        >
          <h4 className={styles.servicesToggleHeader}>{displayInfo.title}</h4>
          <div className={styles.servicesToggleText}>{displayInfo.description}</div>
        </label>
        <div className="d-flex align-items-center">
          {isLoading[serviceType] && (
            <div className="spinner-border spinner-border-sm me-2" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          )}
          <input
            type="checkbox"
            className="form-check-input"
            id={`${serviceType}Toggle`}
            checked={servicesState[serviceType] === serviceModes.on}
            onChange={() => handleToggleChange(serviceType, servicesState[serviceType] !== serviceModes.on)}
            disabled={isLoading[serviceType] || isLoading['system']}
          />
        </div>
      </div>
    );
  };

  const serviceTypes = Object.keys(IOTServices);
  const servicesPerColumn = Math.ceil(serviceTypes.length / 4);
  const columns = Array.from({ length: 4 }, (_, colIndex) =>
    serviceTypes.slice(colIndex * servicesPerColumn, (colIndex + 1) * servicesPerColumn)
  );

  return (
    <div className="container">
      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          {error}
          <button type="button" className="btn-close" onClick={() => setError(null)} aria-label="Close"></button>
        </div>
      )}

      <div className={[styles.servicesToggle, 'form-check form-switch mb-4'].join(' ')}>
        <label
          className={[styles.servicesToggleLabel, 'form-check-label'].join(' ')}
          role="switch"
          htmlFor="systemToggle"
        >
          <h4 className={styles.servicesToggleHeader}>System Control</h4>
          <div className={styles.servicesToggleText}>Turn the entire system on or off</div>
        </label>
        <div className="d-flex align-items-center">
          {isLoading['system'] && (
            <div className="spinner-border spinner-border-sm me-2" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          )}
          <input
            type="checkbox"
            className="form-check-input"
            id="systemToggle"
            checked={isSystemOn}
            onChange={() => handleSystemToggle(!isSystemOn)}
            disabled={isLoading['system']}
          />
        </div>
      </div>

      <div className="row">
        {columns.map((columnServices, index) => (
          <div key={index} className="col-md-4">
            {columnServices.map((serviceType) => renderServiceToggle(serviceType))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Services;