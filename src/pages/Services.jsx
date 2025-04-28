import React from 'react';
import axios from 'axios';
import styles from '../components/Home/Services.module.css';
import { useContext } from 'react';
import { UserContext } from '../hooks/UserContext.jsx';
import { IOTServices } from '../utils/IOTServices.jsx';

function Services() {
  const { servicesState, setServicesState } = useContext(UserContext);

  const serviceModes = {
    auto: "auto",
    manual: "manual",
    on: "on",
    off: "off"
  }

  // Map frontend display names to service types
  const serviceDisplayNames = {
    [IOTServices.dist_service]: { title: "Distance", description: "Distance between objects" },
    [IOTServices.air_cond_service]: { title: "Air Conditioning", description: "Automatic air conditioning" },
    [IOTServices.drowsiness_service]: { title: "Driver monitoring", description: "Check the driver's status" },
    [IOTServices.humid_service]: { title: "Humidity Control", description: "Monitor and control humidity" },
    [IOTServices.headlight_service]: { title: "Smart Headlights", description: "Adjust Light when it's dark" }
  };

  let safeServicesState = servicesState;

  const handleToggleChange = async (serviceType, value) => {
    const prevState = servicesState;
    try {

      safeServicesState = { ...safeServicesState, [serviceType]: value };
      
      // Send control request to backend
      const response = await axios.patch(
        `${import.meta.env.VITE_SERVER_URL}/iot/service`,
        { [serviceType]: value ? serviceModes.on : serviceModes.off },
        {
          withCredentials: true,
          headers: { 'Content-Type': 'application/json' }
        }
      );

      if (response) {
        setServicesState(safeServicesState);
      }

      console.log(`Service ${serviceType} updated to ${value ? serviceModes.on : serviceModes.off}`);
    } catch (error) {
      // Revert local state on error
      setServicesState(prevState);

      console.error('Error updating service:', error);
    }
    finally {
      console.log("servicesState: ", servicesState);
    }
  };

  const renderServiceToggle = (serviceType) => {
    const displayInfo = serviceDisplayNames[serviceType];
    return (
      <div key={serviceType} className={[styles.servicesToggle, 'form-check form-switch mb-3'].join(' ')}>
        <label 
          className={[styles.servicesToggleLabel, "form-check-label"].join(' ')} 
          role='switch' 
          htmlFor={`${serviceType}Toggle`}
        >
          <h4 className={styles.servicesToggleHeader}>{displayInfo.title}</h4>
          <div className={styles.servicesToggleText}>{displayInfo.description}</div>
        </label>
        <input
          type="checkbox"
          className="form-check-input"
          id={`${serviceType}Toggle`}
          checked={safeServicesState[serviceType]}
          onChange={() => handleToggleChange(serviceType, !safeServicesState[serviceType])}
        />
      </div>
    );
  };

  // Group services into columns
  const serviceTypes = Object.keys(IOTServices);
  const servicesPerColumn = Math.ceil(serviceTypes.length / 3);
  const columns = Array.from({ length: 3 }, (_, colIndex) => 
    serviceTypes.slice(colIndex * servicesPerColumn, (colIndex + 1) * servicesPerColumn)
  );

  return (
    <div className="row">
      {columns.map((columnServices, index) => (
        <div key={index} className="col-md-4">
          {columnServices.map(serviceType => renderServiceToggle(serviceType))}
        </div>
      ))}
    </div>
  );
}

export default Services;