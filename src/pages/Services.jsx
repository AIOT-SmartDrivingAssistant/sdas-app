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

  const [thresholdValues, setThresholdValues] = useState({
    air_cond_service: {
      temp_threshold: 0,
      humid_threshold: 0
    },
    drowsiness_service: {
      drowsiness_threshold: 0
    },
    headlight_service: {
      lux_threshold: 0
    },
    distance_service: {
      distance_threshold: 0
    },
  });

  const updateThresholdValues = (status) => {
    setThresholdValues({
      air_cond_service: {
        temp_threshold: status?.temp_threshold || 0,
        humid_threshold: status?.humid_threshold || 0
      },
      drowsiness_service: {
        drowsiness_threshold: status?.drowsiness_threshold || 0
      },
      headlight_service: {
        lux_threshold: status?.lux_threshold || 0
      },
      distance_service: {
        distance_threshold: status?.distance_threshold || 0
      },
    });
  }

  useEffect(() => {
    setPageServicesState(servicesStatus);
    updateThresholdValues(servicesStatus);
  }, [servicesStatus]);

  const serviceDisplayNames = {
    [IOTFields.services.air_cond_service]: { 
      title: 'Air Conditioning',
      description: 'Automatic air conditioning',
      thresholds:{
        temp_threshold: 'Temperature Threshold',
        humid_threshold: 'Humidity Threshold'
      }
    },
    [IOTFields.services.drowsiness_service]: {
      title: 'Driver Monitoring',
      description: "Check the driver's status",
      thresholds:{
        drowsiness_threshold: 'Drowsiness Threshold'
      }
    },
    [IOTFields.services.headlight_service]: {
      title: 'Smart Headlights',
      description: "Adjust light when it's dark",
      thresholds: {
        lux_threshold: 'Lux Threshold'
      }
    },
    [IOTFields.services.distance_service]: {
      title: 'Distance',
      description: 'Distance between objects',
      thresholds: {
        distance_threshold: 'Distance Threshold'
      }
    },
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

  const thresholdFieldsForService = {
    air_cond_service: ["temp_threshold", "humid_threshold"],
    headlight_service: ["lux_threshold"],
    distance_service: ["distance_threshold"],
    drowsiness_service: ["drowsiness_threshold"]
  };

  const renderThresholdInputs = (serviceType) => {
    const thresholds = thresholdFieldsForService[serviceType];

    const handleThresholdChange = async (threshold, e) => {
      const val = Number(e.target.value);
      setThresholdValues((prev) => ({
        ...prev,
        [serviceType]: {
          ...prev[serviceType],
          [threshold]: val,
        },
      }));
    };

    const handleThresholdBlur = async (threshold, e) => {
      const val = Number(e.target.value);
      const formData = {
        service_type: threshold,
        value: val.toString()
      };
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

        setServicesStatus((prev) => {
          return ({
            ...prev,
            [threshold]: val
          })
        });

        console.log(`handleThresholdBlur's response:`, responseData);
        toast.success(SuccessMessages.controlIot.setThreshold);
      } catch (error) {
        updateThresholdValues(servicesStatus);
        console.error(`handleThresholdBlur's error:`, error);
        toast.error(`${ErrorMessages.iot.setThreshold}${error.message}`);
      }
    };

      return (
        <div className={styles.servicesInputNumberWrapper}>
          {thresholds.map((threshold) => (
            <div key={threshold} className={styles.servicesInputNumberGroup}>
              <span className={styles.servicesInputNumberLabel}>{serviceDisplayNames[serviceType].thresholds[threshold]}</span>
              <input
                className={styles.servicesInputNumberBox}
                type="number"
                value={thresholdValues[serviceType][threshold] || 0}
                onChange={(e) => handleThresholdChange(threshold, e)}
                onBlur={(e) => handleThresholdBlur(threshold, e)}
                disabled={servicesStatus[serviceType] !== IOTFields.state.on || isLoading[serviceType] || !servicesStatus?.system_status}
                placeholder="0"
                min={1}
                max={99}
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
            checked={pageServicesState[serviceType] === IOTFields.state.on}
            onChange={() => handleToggleChange(serviceType, pageServicesState[serviceType] !== IOTFields.state.on)}
            disabled={servicesStatus[serviceType] !== IOTFields.state.on || isLoading[serviceType] || !servicesStatus?.system_status}
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