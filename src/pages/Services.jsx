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

  const [thresholdValues, setThresholdValues] = useState({
    air_cond_service: {},
    drowsiness_service: {},
    headlight_service: {},
    distance_service: {},
  });


  const serviceDisplayNames = {
    [IOTFields.services.air_cond_service]: { title: 'Air Conditioning', description: 'Automatic air conditioning', thresholds:['Temperature Threshold','Humidity Threshold']},
    [IOTFields.services.drowsiness_service]: { title: 'Driver Monitoring', description: "Check the driver's status", thresholds:['Drowsiness Threshold'] },
    [IOTFields.services.headlight_service]: { title: 'Smart Headlights', description: "Adjust light when it's dark", thresholds:['Lux Threshold'] },
    [IOTFields.services.distance_service]: { title: 'Distance', description: 'Distance between objects', thresholds:['Distance Threshold'] },
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

  const renderThresholdInputs = (serviceType) => {
    const displayInfo = serviceDisplayNames[serviceType];
    const thresholds = displayInfo.thresholds;

    // Đảm bảo thresholdValues[serviceType] đã có key cho từng threshold
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
      setThresholdValues((prev) => {
        if (!prev[serviceType] || Object.keys(prev[serviceType]).length !== thresholds.length) {
          const initial = {};
          thresholds.forEach((th) => {
            initial[th] = '';
          });
          return { ...prev, [serviceType]: initial };
        }
        return prev;
      });
    }, [serviceType, thresholds]);

    const handleThresholdChange = async (th, e) => {
      const val = e.target.value.replace(/\D/g, '').slice(0, 3); 
      setThresholdValues((prev) => ({
        ...prev,
        [serviceType]: {
          ...prev[serviceType],
          [th]: val,
        },
      }));
    };

    const handleThresholdBlur = async (th, e) => {
      const val = e.target.value.replace(/\D/g, '').slice(0, 3);
      const formData = {
        service_type: serviceType,
        thresholds: {
          ...thresholdValues[serviceType],
          [th]: val,
        }
      };
      try {
        const responseData = await apiClient(
          'PATCH',
          `${import.meta.env.VITE_SERVER_URL}/iot/service`,
          {
            body: JSON.stringify(formData),
          }
        );
        console.log(`handleThresholdBlur's response:`, responseData);
        toast.success(SuccessMessages.controlIot.setThreshold);
      } catch (error) {
        console.error(`handleThresholdBlur's error:`, error);
        toast.error(`${ErrorMessages.iot.setThreshold}${error.message}`);
      }
  };

      return (
        <div className={styles.servicesInputNumberWrapper}>
          {thresholds.map((th) => (
            <div key={th} className={styles.servicesInputNumberGroup}>
              <span className={styles.servicesInputNumberLabel}>{th}</span>
              <input
                className={styles.servicesInputNumberBox}
                type="number"
                value={thresholdValues[serviceType]?.[th] || ''}
                onChange={(e) => handleThresholdChange(th, e)}
                onBlur={(e) => handleThresholdBlur(th, e)}
                placeholder="0"
                min={0}
                max={999}
              />
            </div>
          ))}
        </div>
      );
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
          {renderThresholdInputs(serviceType)}


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