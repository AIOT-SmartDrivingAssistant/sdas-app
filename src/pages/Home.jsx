import 'react-range-slider-input/dist/style.css';
import styles from '../components/Home/Home.module.css';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserContext } from '../hooks/UserContext.jsx';
import { SensorTypes } from '../utils/CommonFields.jsx';
import { handleRefreshToken } from '../utils/helpers.js';
import apiClient from '../services/APIClient.jsx';

const Home = () => {
  const navigate = useNavigate();
  const {
    userData,
    setUserData,
    userAvatar,
    setUserAvatar,
    servicesState,
    setServicesState,
    sensorData,
    setSensorData,
    addActionToHistory,
    initializeApp,
    clearUserContext,
  } = useUserContext();

  const [isFirstLoad, setIsFirstLoad] = useState(true);

  useEffect(() => {
    const handleInitialize = async () => {
      await initializeApp();
      setIsFirstLoad(false);
    }

    if (isFirstLoad) handleInitialize();

    return () => {};
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [data, setData] = useState({
    distance: 0,
    temperature: 0,
    humidity: 0,
    lightLevel: 0,
    incline: 0,
    headlightsMode: 'Manual',
    headlightsBrightness: 0,
    driverStatus: 'Alert',
    airConditioner: {
      status: 'Manual',
      temperature: 1,
    },
  });

  const [loading, setLoading] = useState({
    air_cond_service: false,
    dist_service: false,
    headlight_service: false,
    drowsiness_service: false,
  });

  const [errors, setErrors] = useState({
    general: null,
    air_cond_service: null,
    dist_service: null,
    headlight_service: null,
    drowsiness_service: null,
  });

  // useEffect for re-fetching Home page needed data
  useEffect(() => {
    if (isFirstLoad || (userData && userAvatar && servicesState)) {
      return;
    }

    const handleGetUserData = async () => {
      try {
        const _userData = await apiClient('GET', `${import.meta.env.VITE_SERVER_URL}/user/`);
        setUserData(_userData);
      }
      catch (error) {
        console.error('Fail to get user data: ', error);
      }
    }
    const handleGetUserAvatar = async () => {
      try {
        const _userAvatar = await apiClient('GET', `${import.meta.env.VITE_SERVER_URL}/user/avatar`);
        setUserAvatar(_userAvatar);
      }
      catch (error) {
        console.error('Fail to get user avatar: ', error);
      }
    }
    const handleGetServicesState = async () => {
      try {
        const _servicesStatus = await apiClient('GET', `${import.meta.env.VITE_SERVER_URL}/app/services_status`);
        setServicesState(_servicesStatus);
      }
      catch (error) {
        console.error('Fail to get services state: ', error);
      }
    }

    if (!userData) {
      handleGetUserData();
    }
    if (!userAvatar) {
      handleGetUserAvatar();
    }
    if (!servicesState) {
      handleGetServicesState();
    }

    return () => {};
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // useEffect for continuously fetching sensor data 
  useEffect(() => {
    const handleGetSensorData = async () => {
      if (!servicesState) return;

      setErrors((prev) => ({
        ...prev,
        air_cond_service: null,
        dist_service: null,
        headlight_service: null,
        drowsiness_service: null,
      }));

      setLoading({
        air_cond_service: servicesState?.air_cond_service === 'on',
        dist_service: servicesState?.dist_service === 'on',
        headlight_service: servicesState?.headlight_service === 'on',
        drowsiness_service: servicesState?.drowsiness_service === 'on',
      });

      try {
        const activeSensorTypes = [];
        const serviceToSensors = {
          air_cond_service: [SensorTypes.temp, SensorTypes.humid],
          headlight_service: [SensorTypes.lux],
          dist_service: [SensorTypes.dist],
        };

        Object.keys(serviceToSensors).forEach((service) => {
          if (servicesState[service] === 'on') {
            activeSensorTypes.push(...serviceToSensors[service]);
          }
        });

        if (activeSensorTypes.length === 0) {
          setLoading({
            air_cond_service: false,
            dist_service: false,
            headlight_service: false,
            drowsiness_service: false,
          });
          return true;
        }

        const sensorTypesParam = activeSensorTypes.join(',');

        const _sensorData = await apiClient(
          'GET',
          `${import.meta.env.VITE_SERVER_URL}/app/sensor_data?sensor_types=${sensorTypesParam}`
        )

        const sensorList = _sensorData.slice(0, 10);
        const newData = { ...data };
        const newSensorData = { ...sensorData };

        sensorList.forEach((sensor) => {
          const value = parseFloat(sensor.value);
          let type = sensor.sensor_type.toString().toLowerCase().replace(/\s+|\W+/g, '');

          switch (type) {
            case SensorTypes.temp:
              newData.temperature = value;
              newSensorData.temperature = value;
              break;
            case SensorTypes.humid:
              newData.humidity = value;
              newSensorData.humidity = value;
              break;
            case SensorTypes.dist:
              newData.distance = value;
              newSensorData.distance = value;
              break;
            case SensorTypes.lux:
              newData.lightLevel = value;
              newSensorData.lightLevel = value;
              break;
            default:
              break;
          }
        });

        setData(newData);
        setSensorData(newSensorData);
        return true;
      } catch (error) {
        console.error('Fail to fetch sensor data:', error);
        const errorMessage = error.message;
        setErrors((prev) => ({
          ...prev,
          air_cond_service: servicesState.air_cond_service === 'on' ? errorMessage : null,
          dist_service: servicesState.dist_service === 'on' ? errorMessage : null,
          headlight_service: servicesState.headlight_service === 'on' ? errorMessage : null,
        }));
        return false;
      } finally {
        setLoading({
          air_cond_service: false,
          dist_service: false,
          headlight_service: false,
          drowsiness_service: false,
        });
      }
    };

    handleGetSensorData();
    const intervalId = setInterval(handleGetSensorData, 3000);

    return () => {
      clearInterval(intervalId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const getDistanceWarning = (distance) => {
    if (distance < 50) return { class: 'bg-danger', message: 'Danger' };
    if (distance < 100) return { class: 'bg-warning', message: 'Warning' };
    return { class: 'bg-success', message: 'Safe' };
  };

  const changeACMode = (mode) => {
    setData((prevData) => ({
      ...prevData,
      airConditioner: {
        ...prevData.airConditioner,
        status: mode,
      },
    }));
  };

  const sendACTemperatureToBackend = async (temperature, retry = true) => {
    if (servicesState.air_cond_service !== 'on') return;

    const constrainedValue = Math.max(1, Math.min(100, temperature));

    try {
      setLoading((prev) => ({ ...prev, air_cond_service: true }));
      const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/iot/service`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_type: 'air_cond_temp',
          value: constrainedValue.toString(),
        }),
      });

      if (response.status === 401 && retry) {
        const refreshed = await handleRefreshToken(navigate, clearUserContext);
        if (refreshed) {
          return sendACTemperatureToBackend(temperature, false);
        }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to update temperature');
      }

      console.log('Temperature updated successfully:', await response.json());
      setData((prevData) => ({
        ...prevData,
        airConditioner: {
          ...prevData.airConditioner,
          temperature: constrainedValue,
        },
      }));
      addActionToHistory('service_toggle', {
        serviceType: 'air_cond_temp',
        value: constrainedValue,
        status: 'success',
      });
    } catch (error) {
      console.error('Error updating temperature:', error.message);
      setErrors((prev) => ({
        ...prev,
        air_cond_service: 'Failed to update temperature.',
      }));
      addActionToHistory('service_toggle', {
        serviceType: 'air_cond_temp',
        value: constrainedValue,
        status: 'failed',
        error: error.message,
      });
    } finally {
      setLoading((prev) => ({ ...prev, air_cond_service: false }));
    }
  };

  const setACTemperature = (temp) => {
    const newTemp = Math.max(1, Math.min(100, temp));
    setData((prevData) => ({
      ...prevData,
      airConditioner: {
        ...prevData.airConditioner,
        temperature: newTemp,
      },
    }));
    sendACTemperatureToBackend(newTemp);
  };

  const getDriverStatusColor = () => {
    switch (data.driverStatus) {
      case 'Alert':
        return 'bg-green-500';
      case 'Tired':
        return 'bg-yellow-500';
      case 'Distracted':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const setHeadlightIntensity = (level) => {
    setData((prevData) => ({
      ...prevData,
      headlightsBrightness: level,
    }));
  };

  const getHeadlightStatusText = () => {
    switch (data.headlightsBrightness) {
      case 0:
        return 'Off';
      case 1:
        return '1';
      case 2:
        return '2';
      case 3:
        return '3';
      case 4:
        return '4';
      default:
        return 'Unknown';
    }
  };

  const handleSendMockNotificationRequest = async (retry = true) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/app/mock_notification`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.status === 401 && retry) {
        const refreshed = await handleRefreshToken(navigate, clearUserContext);
        if (refreshed) {
          return handleSendMockNotificationRequest(false);
        }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to send mock notification');
      }

      console.log('Mock notification sent:', await response.json());
    } catch (error) {
      console.error('Error sending mock notification:', error);
    }
  };

  return (
    <div className="container-fluid p-0">
      {errors.general && <div className="alert alert-danger">{errors.general}</div>}

      <button onClick={() => handleSendMockNotificationRequest()}>
        Mock Notification
      </button>

      <div className="row g-3 mb-3">
        {servicesState?.air_cond_service !== undefined && (
          <div className="col-12 col-lg-4">
            <div
              className={[
                styles.panel,
                'p-4 shadow bg-white rounded',
                servicesState?.air_cond_service !== 'on' ? styles.blurred : '',
              ].join(' ')}
            >
              <h4 className="mb-3">Air conditioning</h4>
              {loading.air_cond_service ? (
                <div className="text-center">
                  <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : (
                <>
                  <div className="row">
                    <div className="mb-3 col-md-6">
                      <p className="mb-1 small text-body-tertiary">Temperature</p>
                      <p className="fw-bold fs-2 mb-1">{data.temperature?.toFixed(1)}°C</p>
                    </div>
                    <div className="mb-3 col-md-6">
                      <p className="mb-1 small text-body-tertiary">Humidity</p>
                      <p className="fw-bold fs-2 mb-1">{data.humidity?.toFixed(1)}%</p>
                    </div>
                  </div>
                  <div className="mb-2">
                    <p className="mb-2 small text-body-tertiary">Air conditioning mode</p>
                    <div className="d-flex flex-wrap">
                      <button
                        className={`rounded btn ${
                          data.airConditioner?.status === 'Manual' ? 'bg-primary-btn' : 'bg-gray-200'
                        } me-2 mb-2 px-3 py-1`}
                        onClick={() => changeACMode('Manual')}
                        disabled={servicesState?.air_cond_service !== 'on'}
                      >
                        Manual
                      </button>
                      <button
                        className={`rounded btn ${
                          data.airConditioner?.status === 'Off' ? 'bg-primary-btn' : 'bg-gray-200'
                        } mb-2 px-3 py-1`}
                        onClick={() => changeACMode('Off')}
                        disabled={servicesState?.air_cond_service !== 'on'}
                      >
                        Off
                      </button>
                    </div>
                    {data.airConditioner.status !== 'Off' && (
                      <div className="my-3">
                        <span className="me-2">Set:</span>
                        <button
                          className="btn btn-outline-secondary py-1 bg-gray-200 rounded"
                          onClick={() => setACTemperature(data.airConditioner.temperature - 1)}
                          disabled={servicesState?.air_cond_service !== 'on'}
                        >
                          -
                        </button>
                        <span className="mx-2">{data.airConditioner.temperature}</span>
                        <button
                          className="btn btn-outline-secondary py-1 bg-gray-200 rounded"
                          onClick={() => setACTemperature(data.airConditioner.temperature + 1)}
                          disabled={servicesState?.air_cond_service !== 'on'}
                        >
                          +
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {servicesState?.drowsiness_service !== undefined && (
          <div className="col-12 col-lg-4">
            <div
              className={[
                styles.panel,
                'p-4 shadow bg-white rounded',
                servicesState?.drowsiness_service !== 'on' ? styles.blurred : '',
              ].join(' ')}
            >
              <h4 className="mb-3">Driver Monitoring</h4>
              {loading.drowsiness_service ? (
                <div className="text-center">
                  <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : (
                <>
                  <div className="mb-3 d-flex align-items-center">
                    <div
                      className={`rounded-circle me-2 ${getDriverStatusColor()}`}
                      style={{ width: '16px', height: '16px' }}
                    ></div>
                    {errors.drowsiness_service ? (
                      <p className="mb-0 fw-bold fs-4 text-danger">{errors.drowsiness_service}</p>
                    ) : (
                      <p className="mb-0 fw-bold fs-4">{data.driverStatus}</p>
                    )}
                  </div>
                  <div className="mb-3">
                    <p className="mb-2 small text-body-tertiary">Sleepiness Detection Sensitivity</p>
                    <div className="d-flex align-items-center">
                      <span className="me-2 small">Low</span>
                      <input
                        type="range"
                        min="0"
                        max="10"
                        value="3"
                        onChange={() => {}}
                        className="mx-2 flex-grow-1"
                        disabled={servicesState?.drowsiness_service !== 'on'}
                      />
                      <span className="ms-2 small">High</span>
                    </div>
                  </div>
                  <div className="bg-light rounded p-3">
                    <p className="fw-medium mb-2">Recent Alerts:</p>
                    <ul className="list-unstyled mb-0">
                      <li className="text-muted mb-1">
                        {new Date().toLocaleTimeString()} - Driver Status:{' '}
                        {errors.drowsiness_service ? errors.drowsiness_service : data.driverStatus}
                      </li>
                    </ul>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {servicesState?.headlight_service !== undefined && (
          <div className="col-12 col-lg-4">
            <div
              className={[
                styles.panel,
                'p-4 shadow bg-white rounded',
                servicesState?.headlight_service !== 'on' ? styles.blurred : '',
              ].join(' ')}
            >
              <h4 className="mb-3">Smart Headlights</h4>
              {loading.headlight_service ? (
                <div className="text-center">
                  <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <p className="mb-2 small text-body-tertiary">Ambient Light Intensity</p>
                    {errors.headlight_service ? (
                      <p className="text-danger mb-1">{errors.headlight_service}</p>
                    ) : (
                      <>
                        <div className="progress mb-1">
                          <div
                            className="progress-bar bg-primary"
                            role="progressbar"
                            style={{ width: `${data.lightLevel}%` }}
                            aria-valuemin="0"
                            aria-valuemax="100"
                          ></div>
                        </div>
                        <p className="mb-3 text-end small">{data.lightLevel}%</p>
                      </>
                    )}
                    <div>
                      <p className="mb-2 small text-body-tertiary">
                        Headlight level:{' '}
                        <span className="fw-bold" style={{ color: '#022f6c' }}>
                          {getHeadlightStatusText()}
                        </span>
                      </p>
                      <div className="btn-group small d-flex w-100" role="group">
                        {[0, 1, 2, 3, 4].map((level) => (
                          <button
                            key={level}
                            type="button"
                            disabled={servicesState?.headlight_service !== 'on'}
                            className={`flex-fill btn ${
                              data.headlightsBrightness === level ? 'bg-primary-btn' : 'bg-gray-200'
                            } ${level === 0 ? 'rounded-l' : level === 4 ? 'rounded-r' : ''}`}
                            onClick={() => setHeadlightIntensity(level)}
                          >
                            {level}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {servicesState?.dist_service !== undefined && (
          <div className="col-12 col-lg-4">
            <div
              className={[
                styles.panel,
                'p-4 shadow bg-white rounded',
                servicesState?.dist_service !== 'on' ? styles.blurred : '',
              ].join(' ')}
            >
              <h4 className="mb-3">Distance Sensor</h4>
              {loading.dist_service ? (
                <div className="text-center">
                  <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : (
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <>
                      <p className="fw-bold fs-2 mb-1">{data.distance} cm</p>
                      <button
                        disabled
                        className={`rounded btn text-white ${getDistanceWarning(data.distance).class} px-3 py-1`}
                      >
                        {getDistanceWarning(data.distance).message}
                      </button>
                    </>
                  </div>
                  <div className={`${styles.distanceSensorIcon} rounded-5`}>
                    <i className="fa-solid fa-bolt"></i>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;