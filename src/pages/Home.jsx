import defaultAvatar from '../assets/images/default_avatar.png';
import 'react-range-slider-input/dist/style.css';
import styles from '../components/Home/Home.module.css';

import React, { useEffect } from 'react';

import toast from 'react-hot-toast';

import apiClient from '../services/APIClient.jsx';
import { useUserContext } from '../hooks/UserContext.jsx';

import { IOTFields } from '../utils/CommonFields.jsx';
import { ErrorMessages, SuccessMessages } from '../utils/CommonMessages.jsx';

const Home = () => {
  const {
    userData,
    setUserData,
    userAvatar,
    setUserAvatar,
    servicesStatus,
    setServicesStatus,
    sensorsData,
    setSensorsData,

    initializeApp,
    isFirstLoad,
  } = useUserContext();

  const [data, setData] = React.useState({
    distance: 0,
    temperature: 0,
    humidity: 0,
    lightLevel: 0,
    incline: 0,
    headlightMode: IOTFields.mode.manual,
    headlightBrightness: 0,
    driverStatus: IOTFields.state.alert,
    airCond: {
      status: IOTFields.state.manual,
      temperature: 1,
    },
  });

  const [loading, setLoading] = React.useState({
    air_cond_service: false,
    distance_service: false,
    headlight_service: false,
    drowsiness_service: false,
  });

  const [errors, setErrors] = React.useState({
    general: null,
    air_cond_service: null,
    distance_service: null,
    headlight_service: null,
    drowsiness_service: null,
  });

  // useEffect for initializing app
  useEffect(() => {
    if (isFirstLoad) {
      initializeApp();
    }
  }, [isFirstLoad, initializeApp]);

  // useEffect for missing needed data for Home page
  useEffect(() => {
    if (isFirstLoad || (userData && userAvatar && servicesStatus)) {
      return;
    }

    const handleGetUserData = async () => {
      try {
        const _userData = await apiClient(
          'GET',
          `${import.meta.env.VITE_SERVER_URL}/user/`,
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
        setUserData(_userData);
      } catch (error) {
        console.error('Fail to get user data: ', error);
      }
    };
    const handleGetUserAvatar = async () => {
      try {
        const _userAvatar = await apiClient(
          'GET',
          `${import.meta.env.VITE_SERVER_URL}/user/avatar`,
          {
            headers: {
              'Content-Type': 'multipart/blob'
            }
          },
          true
        );
        const reader = new FileReader();
        reader.onloadend = () => setUserAvatar(reader.result);
        reader.readAsDataURL(_userAvatar);
      } catch (error) {
        setUserAvatar(defaultAvatar);
        console.error('Fail to get user avatar: ', error);
      }
    };
    const handleGetServicesState = async () => {
      try {
        const _servicesStatus = await apiClient(
          'GET',
          `${import.meta.env.VITE_SERVER_URL}/app/services_status`,
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
        setServicesStatus(_servicesStatus);
      } catch (error) {
        console.error('Fail to get services state: ', error);
      }
    };

    if (!userData) {
      handleGetUserData();
    }
    if (!userAvatar) {
      handleGetUserAvatar();
    }
    if (!servicesStatus) {
      handleGetServicesState();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // useEffect for continuously fetching sensor data
  useEffect(() => {
    const handleGetSensorData = async () => {
      if (servicesStatus?.system_status !== IOTFields.state.on) return;

      setErrors((prev) => ({
        ...prev,
        air_cond_service: null,
        distance_service: null,
        headlight_service: null,
        drowsiness_service: null,
      }));

      setLoading({
        air_cond_service: servicesStatus?.air_cond_service === IOTFields.state.on,
        distance_service: servicesStatus?.distance_service === IOTFields.state.on,
        headlight_service: servicesStatus?.headlight_service === IOTFields.state.on,
        drowsiness_service: servicesStatus?.drowsiness_service === IOTFields.state.on,
      });

      try {
        const activeSensorTypes = [];
        const serviceToSensors = {
          air_cond_service: [IOTFields.sensors.temp, IOTFields.sensors.humid],
          headlight_service: [IOTFields.sensors.lux],
          distance_service: [IOTFields.sensors.distance],
        };

        Object.keys(serviceToSensors).forEach((service) => {
          if (servicesStatus[service] === IOTFields.state.on) {
            activeSensorTypes.push(...serviceToSensors[service]);
          }
        });

        if (activeSensorTypes.length === 0) {
          setLoading({
            air_cond_service: false,
            distance_service: false,
            headlight_service: false,
            drowsiness_service: false,
          });
          return true;
        }

        const sensorTypesParam = activeSensorTypes.join(',');

        const _sensorData = await apiClient(
          'GET',
          `${import.meta.env.VITE_SERVER_URL}/app/sensor_data?sensor_types=${sensorTypesParam}`
        );

        const newData = { ...data };
        const newSensorData = { ...sensorsData };

        _sensorData.forEach((sensor) => {
          const value = parseFloat(sensor.value);
          let type = sensor.sensor_type.toString().toLowerCase().replace(/\s+|\W+/g, '');

          switch (type) {
            case IOTFields.sensors.temp:
              newData.temperature = value;
              newSensorData.temperature = value;
              break;
            case IOTFields.sensors.humid:
              newData.humidity = value;
              newSensorData.humidity = value;
              break;
            case IOTFields.sensors.distance:
              newData.distance = value;
              newSensorData.distance = value;
              break;
            case IOTFields.sensors.lux:
              newData.lightLevel = value;
              newSensorData.lightLevel = value;
              break;
            default:
              break;
          }
        });

        setData(newData);
        setSensorsData(newSensorData);
      } catch (error) {
        console.error(`handleGetSensorData's error:`, error);
        const errorMessage = error.message;
        setErrors((prev) => ({
          ...prev,
          air_cond_service: servicesStatus?.air_cond_service === IOTFields.state.on ? errorMessage : null,
          distance_service: servicesStatus?.distance_service === IOTFields.state.on ? errorMessage : null,
          headlight_service: servicesStatus?.headlight_service === IOTFields.state.on ? errorMessage : null,
        }));
      }
      finally {
        setLoading({
          air_cond_service: false,
          distance_service: false,
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
  }, [servicesStatus])

  const getDistanceWarning = (distance) => {
    if (distance < 50) return { class: 'bg-danger', message: 'Danger' };
    if (distance < 100) return { class: 'bg-warning', message: 'Warning' };
    return { class: 'bg-success', message: 'Safe' };
  };

  const changeACMode = (mode) => {
    setData((prevData) => ({
      ...prevData,
      airCond: {
        ...prevData.airCond,
        status: mode,
      },
    }));
  };

  const sendACTemperatureToBackend = async (temperature) => {
    if (servicesStatus?.air_cond_service !== IOTFields.state.on) return;

    const constrainedValue = Math.max(0, Math.min(100, temperature));

    try {
      setLoading((prev) => ({ ...prev, air_cond_service: true }));

      const responseData = await apiClient(
        'PATCH',
        `${import.meta.env.VITE_SERVER_URL}/iot/service`,
        {
          body: JSON.stringify({
            service_type: IOTFields.services.air_cond_service,
            value: constrainedValue.toString(),
          })
        }
      );

      toast.success(SuccessMessages.controlIot.controlService);
      console.log(`sendACTemperatureToBackend's response:`, responseData);

      setData((prevData) => ({
        ...prevData,
        airCond: {
          ...prevData.airCond,
          temperature: constrainedValue,
        },
      }));
    } catch (error) {
      toast.error(`${ErrorMessages.iot.controlService}${error.message}`);
      console.error(`sendACTemperatureToBackend's error:`, error.message);

      setErrors((prev) => ({
        ...prev,
        air_cond_service: `${ErrorMessages.iot.controlService}${error.message}`,
      }));
    } finally {
      setLoading((prev) => ({ ...prev, air_cond_service: false }));
    }
  };

  const setACTemperature = (temp) => {
    const newTemp = Math.max(0, Math.min(100, temp));
    setData((prevData) => ({
      ...prevData,
      airCond: {
        ...prevData.airCond,
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
      headlightBrightness: level,
    }));
  };

  const getHeadlightStatusText = () => {
    switch (data.headlightBrightness) {
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

  return (
    <div className="container-fluid p-0">
      {errors.general && <div className="alert alert-danger">{errors.general}</div>}

      <div className="row g-3 mb-3">
        {servicesStatus?.air_cond_service && (
          <div className="col-12 col-lg-4">
            <div
              className={[
                styles.panel,
                'p-4 shadow bg-white rounded',
                servicesStatus?.air_cond_service !== IOTFields.state.on ? styles.blurred : '',
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
                          data.airCond?.status === IOTFields.mode.manual ? 'bg-primary-btn' : 'bg-gray-200'
                        } me-2 mb-2 px-3 py-1`}
                        onClick={() => changeACMode(IOTFields.mode.manual)}
                        disabled={servicesStatus?.air_cond_service !== IOTFields.state.on}
                      >
                        Manual
                      </button>
                      <button
                        className={`rounded btn ${
                          data.airCond?.status === IOTFields.state.on ? 'bg-primary-btn' : 'bg-gray-200'
                        } mb-2 px-3 py-1`}
                        onClick={() => changeACMode(IOTFields.state.on)}
                          disabled={servicesStatus?.air_cond_service !== IOTFields.state.on}
                      >
                        Off
                      </button>
                    </div>
                      {data.airCond.status !== IOTFields.state.off && (
                        <div className="my-3">
                          <span className="me-2">Set:</span>
                          <button
                            className="btn btn-outline-secondary py-1 bg-gray-200 rounded"
                            onClick={() => setACTemperature(data.airCond.temperature - 1)}
                            disabled={servicesStatus?.air_cond_service !== IOTFields.state.on}
                          >
                            -
                          </button>
                          <span className="mx-2">{data.airCond.temperature}</span>
                          <button
                            className="btn btn-outline-secondary py-1 bg-gray-200 rounded"
                            onClick={() => setACTemperature(data.airCond.temperature + 1)}
                            disabled={servicesStatus?.air_cond_service !== 'on'}
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

        {servicesStatus?.drowsiness_service && (
          <div className="col-12 col-lg-4">
            <div
              className={[
                styles.panel,
                'p-4 shadow bg-white rounded',
                servicesStatus?.drowsiness_service !== IOTFields.state.on ? styles.blurred : '',
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
                        disabled={servicesStatus?.drowsiness_service !== IOTFields.state.on}
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

        {servicesStatus?.headlight_service && (
          <div className="col-12 col-lg-4">
            <div
              className={[
                styles.panel,
                'p-4 shadow bg-white rounded',
                servicesStatus?.headlight_service !== IOTFields.state.on ? styles.blurred : '',
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
                            disabled={servicesStatus?.headlight_service !== IOTFields.state.on}
                            className={`flex-fill btn ${
                              data.headlightBrightness === level ? 'bg-primary-btn' : 'bg-gray-200'
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

        {servicesStatus?.distance_service && (
          <div className="col-12 col-lg-4">
            <div
              className={[
                styles.panel,
                'p-4 shadow bg-white rounded',
                servicesStatus?.distance_service !== IOTFields.state.on ? styles.blurred : '',
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