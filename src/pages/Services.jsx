import React, { useContext, useState } from 'react';
import axios from 'axios';
import styles from '../components/Home/Services.module.css';
import { UserContext } from '../hooks/UserContext.jsx';
import { IOTServices } from '../utils/IOTServices.jsx';

function Services() {
  const { servicesState, setServicesState, addActionToHistory } = useContext(UserContext);
  const [isLoading, setIsLoading] = useState({
    air_cond_service: false,
    drowsiness_service: false,
    headlight_service: false,
    dist_service: false,
    allServices: false,
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

  // Kiểm tra xem tất cả dịch vụ có đang bật không
  const isAllServicesOn = Object.values(servicesState).every((state) => state === serviceModes.on);

  const handleToggleChange = async (serviceType, value) => {
    if (isLoading[serviceType]) return;

    const newValue = value ? serviceModes.on : serviceModes.off;
    console.log(`Toggling ${serviceType} to ${newValue}`);
    setIsLoading((prev) => ({ ...prev, [serviceType]: true }));
    setError(null);

    const prevState = { ...servicesState };
    const newServicesState = { ...servicesState, [serviceType]: newValue };

    try {
      // const response = await axios.patch(
      //   `${import.meta.env.VITE_SERVER_URL || 'http://localhost:3000'}/iot/service`,
      //   { [serviceType]: newValue },
      //   {
      //     withCredentials: true,
      //     headers: { 'Content-Type': 'application/json' },
      //   }
      // );
      const response = await fetch(
        `${import.meta.env.VITE_SERVER_URL || 'http://localhost:3000'}/iot/service`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            [serviceType]: newValue
          }),
          credentials: 'include'
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
        // TODO: handle error response

      }

      const data = await response.json();
      console.log('Service response:', data);

      setServicesState(newServicesState);
      console.log(`Service ${serviceType} updated to ${newValue}`);

      // Thêm hành động vào history
      addActionToHistory('service_toggle', {
        serviceType,
        value: newValue,
        status: 'success',
      });
    } catch (error) {
      console.error('Error updating service:', error.message, error.response?.data);
      const errorMessage =
        error.response?.status === 401
          ? 'Unauthorized access. Please log in again.'
          : error.response?.status === 422
          ? 'Invalid request. Please try again.'
          : 'Failed to update service. Please try again later.';
      setError(errorMessage);
      setServicesState(prevState);

      // Thêm hành động thất bại vào history
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

  const handleAllServicesToggle = async (value) => {
    if (isLoading['allServices']) return;

    const newValue = value ? serviceModes.on : serviceModes.off;
    console.log(`Toggling all services to ${newValue}`);
    setIsLoading((prev) => ({ ...prev, allServices: true }));
    setError(null);

    const prevState = { ...servicesState };
    const newServicesState = Object.fromEntries(Object.keys(servicesState).map((key) => [key, newValue]));

    try {
      const requests = Object.keys(servicesState).map((serviceType) =>
        fetch(
          `${import.meta.env.VITE_SERVER_URL || 'http://localhost:3000'}/iot/service`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              [serviceType]: newValue
            }),
            credentials: 'include'
          }
        )
      );

      const responses = await Promise.all(requests);

      if (responses.every((response) => response.ok)) {
        setServicesState(newServicesState);
        console.log(`All services updated to ${newValue}`);

        // Thêm hành động vào history
        addActionToHistory('service_toggle', {
          serviceType: 'all',
          value: newValue,
          status: 'success',
        });
      } else {
        throw new Error('One or more requests failed');
        // TODO: handle error response

      }
    } catch (error) {
      console.error('Error updating all services:', error.message, error.response?.data);
      const errorMessage =
        error.response?.status === 401
          ? 'Unauthorized access. Please log in again.'
          : error.response?.status === 422
          ? 'Invalid request. Please try again.'
          : 'Failed to update all services. Please try again later.';
      setError(errorMessage);
      setServicesState(prevState);
      
      // Thêm hành động thất bại vào history
      addActionToHistory('service_toggle', {
        serviceType: 'all',
        value: newValue,
        status: 'failed',
        error: errorMessage,
      });
    } finally {
      setIsLoading((prev) => ({ ...prev, allServices: false }));
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
            disabled={isLoading[serviceType] || isLoading['allServices']}
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

      {/* Switch cho All Services */}
      <div className={[styles.servicesToggle, 'form-check form-switch mb-4'].join(' ')}>
        <label
          className={[styles.servicesToggleLabel, 'form-check-label'].join(' ')}
          role="switch"
          htmlFor="allServicesToggle"
        >
          <h4 className={styles.servicesToggleHeader}>All Services</h4>
          <div className={styles.servicesToggleText}>Control all services at once</div>
        </label>
        <div className="d-flex align-items-center">
          {isLoading['allServices'] && (
            <div className="spinner-border spinner-border-sm me-2" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          )}
          <input
            type="checkbox"
            className="form-check-input"
            id="allServicesToggle"
            checked={isAllServicesOn}
            onChange={() => handleAllServicesToggle(!isAllServicesOn)}
            disabled={isLoading['allServices']}
          />
        </div>
      </div>

      {/* Các switch riêng lẻ */}
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