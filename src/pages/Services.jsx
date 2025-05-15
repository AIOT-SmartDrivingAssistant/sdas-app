import styles from '../components/Home/Services.module.css';
import React, { useEffect, useState } from 'react';
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

  const [ pageServicesState, setPageServicesState ] = useState(servicesState);

  useEffect(() => {
    setPageServicesState(servicesState);
  }, [pageServicesState, servicesState])

  const serviceModes = {
    on: 'on',
    off: 'off',
  };

  const [thresholdValues, setThresholdValues] = useState({
    air_cond_service: {},
    drowsiness_service: {},
    headlight_service: {},
    dist_service: {},
  });


  const serviceDisplayNames = {
    [IOTServices.air_cond_service]: { title: 'Air Conditioning', description: 'Automatic air conditioning', thresholds:['Temperature Threshold','Humidity Threshold']},
    [IOTServices.drowsiness_service]: { title: 'Driver Monitoring', description: "Check the driver's status", thresholds:['Drowsiness Threshold'] },
    [IOTServices.headlight_service]: { title: 'Smart Headlights', description: "Adjust light when it's dark", thresholds:['Lux Threshold'] },
    [IOTServices.dist_service]: { title: 'Distance', description: 'Distance between objects', thresholds:['Distance Threshold'] },
  };

  console.log(pageServicesState)

  const handleToggleChange = async (serviceType, value) => {
    if (isLoading[serviceType] || !systemState) return;

    const newValue = value ? serviceModes.on : serviceModes.off;
    console.log(`Toggling ${serviceType} to ${newValue}`);
    setIsLoading((prev) => ({ ...prev, [serviceType]: true }));
    setError(null);

    const prevState = { ...pageServicesState };
    const newServicesState = { ...pageServicesState, [serviceType]: newValue };
    
    const formData = {
      service_type: serviceType,
      value: newValue,
    }
    console.log(formData);
    try {
      const responseData = await apiClient(
        'PATCH',
        `${import.meta.env.VITE_SERVER_URL}/iot/service`,
        {
          body: JSON.stringify(formData),
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

  const renderThresholdInputs = (serviceType) => {
    const displayInfo = serviceDisplayNames[serviceType];
    const thresholds = displayInfo.thresholds;

    // Đảm bảo thresholdValues[serviceType] đã có key cho từng threshold
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
      // eslint-disable-next-line
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
        console.log('Service response:', responseData);
        toast.success('Threshold updated!');
      } catch (error) {
        toast.error('Failed to update threshold');
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
            onChange={() => handleToggleChange(serviceType, pageServicesState[serviceType] !== 'on')}
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