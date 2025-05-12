import styles from '../components/Home/Services.module.css';
import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useUserContext } from '../hooks/UserContext.jsx';
import { IOTServices } from '../utils/CommonFields.jsx';
import apiClient from '../services/APIClient.jsx';

function Services() {
  const { systemState, servicesState, setServicesState } = useUserContext();
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

  const handleToggleChange = async (serviceType, value) => {
    if (isLoading[serviceType] || !systemState) return;

    const newValue = value ? serviceModes.on : serviceModes.off;
    console.log(`Toggling ${serviceType} to ${newValue}`);
    setIsLoading((prev) => ({ ...prev, [serviceType]: true }));
    setError(null);

    const prevState = { ...servicesState };
    const newServicesState = { ...servicesState, [serviceType]: newValue };

    try {
      const responseData = await apiClient(
        'PATCH',
        `${import.meta.env.VITE_SERVER_URL}/iot/service`,
        {
          body: JSON.stringify({ service_type: serviceType, value: newValue }),
        }
      );

      console.log('Service response:', responseData);

      setServicesState(newServicesState);
      console.log(`Service ${serviceType} updated to ${newValue}`);
      toast.success(`Service ${serviceDisplayNames[serviceType].title} turned ${newValue}!`);
    } catch (error) {
      setError(error);
      setServicesState(prevState);
      toast.error(`Error updating service: ${error}`);
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
            disabled={isLoading[serviceType] || !systemState}
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

      {!systemState && (
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