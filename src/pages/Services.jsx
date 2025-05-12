import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../components/Home/Services.module.css';
import { useUserContext } from '../hooks/UserContext.jsx';
import { IOTServices } from '../utils/CommonFields.jsx';
import { handleRefreshToken } from '../utils/helpers.js';
import toast from 'react-hot-toast';

function Services() {
  const navigate = useNavigate();
  const { servicesState, setServicesState, addActionToHistory, clearUserContext } = useUserContext();
  const [isLoading, setIsLoading] = useState({
    air_cond_service: false,
    drowsiness_service: false,
    headlight_service: false,
    dist_service: false,
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

  // Kiểm tra trạng thái hệ thống
  const isSystemOn = Object.values(servicesState).some((state) => state === serviceModes.on);

  const handleToggleChange = async (serviceType, value, retry = true) => {
    if (isLoading[serviceType] || !isSystemOn) return;

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
      toast.success(`Service ${serviceDisplayNames[serviceType].title} turned ${newValue}!`);
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
      toast.error(errorMessage);
    } finally {
      setIsLoading((prev) => ({ ...prev, [serviceType]: false }));
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
            disabled={isLoading[serviceType] || !isSystemOn}
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

      {!isSystemOn && (
        <div className="alert alert-warning" role="alert">
          System is currently off. Please turn on the system in the sidebar to interact with services.
        </div>
      )}

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