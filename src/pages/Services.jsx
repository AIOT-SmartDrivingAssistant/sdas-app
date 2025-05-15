import styles from '../components/Home/Services.module.css';

import React, { useEffect, useState } from 'react';

import toast from 'react-hot-toast';

import apiClient from '../services/APIClient.jsx';
import { useUserContext } from '../hooks/UserContext.jsx';

import { IOTFields } from '../utils/CommonFields.jsx';
import { SuccessMessages, ErrorMessages } from '../utils/CommonMessages.jsx';

function Services() {
  const { servicesStatus, setServicesStatus } = useUserContext();
  const [isLoading, setIsLoading] = useState({
    air_cond_service: false,
    drowsiness_service: false,
    headlight_service: false,
    dist_service: false,
  });
  const [error, setError] = useState(null);

  const [ pageServicesState, setPageServicesState ] = useState(servicesStatus);

  useEffect(() => {
    setPageServicesState(servicesStatus);
  }, [pageServicesState, servicesStatus])

  const serviceDisplayNames = {
    [IOTFields.services.air_cond_service]: { title: 'Air Conditioning', description: 'Automatic air conditioning' },
    [IOTFields.services.drowsiness_service]: { title: 'Driver Monitoring', description: "Check the driver's status" },
    [IOTFields.services.headlight_service]: { title: 'Smart Headlights', description: "Adjust light when it's dark" },
    [IOTFields.services.dist_service]: { title: 'Distance', description: 'Distance between objects' },
  };

  const handleToggleChange = async (serviceType, value) => {
    if (isLoading[serviceType] || !servicesStatus?.system_status) return;

    const newValue = value ? IOTFields.state.on : IOTFields.state.off;
    console.log(`Toggling ${serviceType} to ${newValue}`);
    setIsLoading((prev) => ({ ...prev, [serviceType]: true }));
    setError(null);

    const prevState = { ...pageServicesState };
    const newServicesStatus = { ...pageServicesState, [serviceType]: newValue };
    
    const formData = {
      service_type: serviceType,
      value: newValue,
    }
    try {
      const responseData = await apiClient(
        'PATCH',
        `${import.meta.env.VITE_SERVER_URL}/iot/service`,
        {
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData),
        }
      );
      console.log(`handleToggleChange's response:`, responseData);

      setServicesStatus(newServicesStatus);
      toast.success(SuccessMessages.controlIot.controlService);
    } catch (error) {
      setError(error);
      setServicesStatus(prevState);
      toast.error(`${ErrorMessages.iot.controlService}${error}`);
    } finally {
      setIsLoading((prev) => ({ ...prev, [serviceType]: false }));
    }
  };

  const renderServiceToggle = (serviceType) => {
    const displayInfo = serviceDisplayNames[serviceType];
    // console.log(`Rendering ${serviceType}, checked: ${pageServicesState[serviceType]}`);

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
            checked={pageServicesState[serviceType] === 'on'}
            onChange={() => handleToggleChange(serviceType, pageServicesState[serviceType] !== IOTFields.state.on)}
            disabled={isLoading[serviceType] || !servicesStatus?.system_status}
          />
        </div>
      </div>
    );
  };

  const serviceTypes = Object.keys(IOTFields.services);
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

      {servicesStatus?.system_status !== IOTFields.state.on && (
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