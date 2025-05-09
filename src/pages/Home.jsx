import React, { useState, useEffect, useContext } from 'react';
import styles from '../components/Home/Home.module.css';
import axios from 'axios';
import { UserContext } from '../hooks/UserContext.jsx';
import RangeSlider from 'react-range-slider-input';
import 'react-range-slider-input/dist/style.css';
import debounce from 'lodash.debounce';
import { SensorTypes, IOTServices } from '../utils/IOTServices.jsx';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';

const Home = () => {
  const { servicesState, setServicesState, addNotification, notifications, sensorData, setSensorData, addActionToHistory } = useContext(UserContext);

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
      temperature: 0,
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

  const [isInitialized, setIsInitialized] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [currentNotification, setCurrentNotification] = useState(null);

  useEffect(() => {
    const source = new EventSource(
      `${import.meta.env.VITE_SERVER_URL || 'http://localhost:3000'}/app/events`,
      { withCredentials: true }
    );

    source.onmessage = (event) => {
      const notification = JSON.parse(event.data);
      addNotification(notification);
      setCurrentNotification(notification);
      setShowModal(true);
      console.log('Received SSE notification:', notification);
    };

    source.onerror = (error) => {
      console.error('SSE error:', error);
    };

    return () => {
      source.close();
    };
  }, []);

  const handleGetUserData = async () => {
    console.log('Starting handleGetUserData...');
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/user/`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.detail || errorData.message}`);
      }

      const data = await response.json();
      console.log('User data fetched successfully:', data);
      return true;
    } catch (error) {
      console.error('Error fetching user data:', {
        message: error.message,
        stack: error.stack,
      });
      setErrors((prev) => ({ ...prev, general: 'Failed to fetch user data.' }));
      return false;
    }
  };

  const handleGetSensorData = async () => {
    console.log('Starting handleGetSensorData...');
    console.log('servicesState:', servicesState);

    setErrors((prev) => ({
      ...prev,
      air_cond_service: null,
      dist_service: null,
      headlight_service: null,
      drowsiness_service: null,
    }));

    setLoading({
      air_cond_service: servicesState.air_cond_service === 'on',
      dist_service: servicesState.dist_service === 'on',
      headlight_service: servicesState.headlight_service === 'on',
      drowsiness_service: servicesState.drowsiness_service === 'on',
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

      console.log('activeSensorTypes:', activeSensorTypes);

      if (activeSensorTypes.length === 0) {
        console.log('No active sensor types, skipping fetch.');
        setLoading({
          air_cond_service: false,
          dist_service: false,
          headlight_service: false,
          drowsiness_service: false,
        });
        return true;
      }

      const sensorTypesParam = activeSensorTypes.join(',');
      console.log('Sending request to /app/sensor_data with sensor_types:', sensorTypesParam);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // Timeout 5 giây

      const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/app/sensor_data?sensor_types=${sensorTypesParam}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      console.log('Response received from /app/sensor_data:', response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.detail || errorData.message}`);
      }

      const responseData = await response.json();
      console.log('Sensor data received:', responseData);

      if (!responseData?.length) {
        setErrors((prev) => ({
          ...prev,
          air_cond_service: servicesState.air_cond_service === 'on' ? 'No sensor data available.' : null,
          dist_service: servicesState.dist_service === 'on' ? 'No sensor data available.' : null,
          headlight_service: servicesState.headlight_service === 'on' ? 'No sensor data available.' : null,
        }));
        return true;
      }

      const sensorList = responseData.slice(0, 10);
      const newData = { ...data };
      const newSensorData = { ...sensorData };

      sensorList.forEach((sensor) => {
        const value = parseFloat(sensor.value);
        let type = sensor.sensor_type
          .toString()
          .toLowerCase()
          .replace(/\s+|\W+/g, '');

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
      console.error('Error fetching sensor data:', {
        message: error.message,
        stack: error.stack,
      });
      const errorMessage = error.message.includes('401')
        ? 'Unauthorized access. Please login again.'
        : error.message.includes('500')
        ? 'Server error. Please try again later.'
        : error.name === 'AbortError'
        ? 'Request timed out. Please try again.'
        : 'Failed to fetch sensor data.';
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

  useEffect(() => {
    const runInitialize = async () => {
      try {
        console.log('useEffect: Running initialize...');
        const userSuccess = await handleGetUserData();
        console.log('handleGetUserData result:', userSuccess);

        if (!userSuccess) {
          console.log('Failed to fetch user data, stopping initialize.');
          setErrors((prev) => ({ ...prev, general: 'Failed to fetch user data.' }));
          return;
        }

        console.log('Setting isInitialized to true');
        setIsInitialized(true);

        console.log('Calling handleGetSensorData...');
        const sensorSuccess = await handleGetSensorData();
        console.log('handleGetSensorData result:', sensorSuccess);

        if (!sensorSuccess) {
          console.log('Failed to fetch sensor data, setting error.');
          setErrors((prev) => ({ ...prev, general: 'Failed to fetch sensor data.' }));
        } else {
          console.log('Initialize completed successfully.');
        }
      } catch (error) {
        console.error('useEffect: Error in initialize:', error);
        setErrors((prev) => ({ ...prev, general: 'Failed to initialize application: ' + error.message }));
      }
    };

    runInitialize();
  }, []);

  const getDistanceWarning = (distance) => {
    if (distance < 50) return { class: 'bg-danger', message: 'Danger' };
    if (distance < 100) return { class: 'bg-warning', message: 'Warning' };
    return { class: 'bg-success', message: 'Safe' };
  };

  const [sliderValues, setSliderValues] = useState({
    airConditioner: [0, 0],
    headLight: [0, 0],
  });

  const handleSliderChange = debounce(async (value, sliderName) => {
    console.log('Updating slider:', sliderName, 'with value:', value);
    setSliderValues((prevValues) => ({
      ...prevValues,
      [sliderName]: value,
    }));

    try {
      const data = {
        service_type: sliderName,
        value: value[1].toString(),
      };

      const response = await axios.post(`${import.meta.env.VITE_SERVER_URL}/iot/service`, data, {
        withCredentials: true,
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.status === 200) {
        console.log(`Slider ${sliderName} API Response:`, response.data);
        addActionToHistory('slider_update', {
          sliderName,
          value: value[1],
          status: 'success',
        });
      }
    } catch (error) {
      console.error(`Slider ${sliderName} Error:`, error.response?.data || error.message);
      addActionToHistory('slider_update', {
        sliderName,
        value: value[1],
        status: 'failed',
        error: error.message,
      });
    }
  }, 300);

  const changeACMode = (mode) => {
    setData((prevData) => ({
      ...prevData,
      airConditioner: {
        ...prevData.airConditioner,
        status: mode,
      },
    }));
  };

  const setACTemperature = (temp) => {
    setData((prevData) => ({
      ...prevData,
      airConditioner: {
        ...prevData.airConditioner,
        temperature: temp,
      },
    }));
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

  const handleCloseModal = () => {
    setShowModal(false);
    setCurrentNotification(null);
  };

  return (
    <div className="container-fluid p-0">
      {errors.general && <div className="alert alert-danger">{errors.general}</div>}

      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>Notification</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {currentNotification ? (
            <p>
              <strong>Service:</strong> {currentNotification.service_type}<br />
              <strong>Message:</strong> {currentNotification.notification}
            </p>
          ) : (
            <p>No notification available.</p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      <div className="row g-3 mb-3">
        {servicesState.air_cond_service !== undefined && (
          <div className="col-12 col-lg-4">
            <div
              className={[styles.panel, 'p-4 shadow bg-white rounded', servicesState.air_cond_service !== 'on' ? styles.blurred : ''].join(' ')}
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
                      {errors.air_cond_service ? (
                        <p className="fw-bold fs-2 mb-1 text-danger">{errors.air_cond_service}</p>
                      ) : (
                        <p className="fw-bold fs-2 mb-1">{data.temperature?.toFixed(1)}°C</p>
                      )}
                    </div>
                    <div className="mb-3 col-md-6">
                      <p className="mb-1 small text-body-tertiary">Humidity</p>
                      {errors.air_cond_service ? (
                        <p className="fw-bold fs-2 mb-1 text-danger">{errors.air_cond_service}</p>
                      ) : (
                        <p className="fw-bold fs-2 mb-1">{data.humidity?.toFixed(1)}%</p>
                      )}
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
                        disabled={servicesState.air_cond_service !== 'on'}
                      >
                        Manual
                      </button>
                      <button
                        className={`rounded btn ${
                          data.airConditioner?.status === 'Off' ? 'bg-primary-btn' : 'bg-gray-200'
                        } mb-2 px-3 py-1`}
                        onClick={() => changeACMode('Off')}
                        disabled={servicesState.air_cond_service !== 'on'}
                      >
                        Off
                      </button>
                    </div>
                    {data.airConditioner.status !== 'Off' && (
                      <div className="my-3">
                        <span className="me-2">Set:</span>
                        <button
                          className="btn btn-outline-secondary py-1 bg-gray-200 rounded"
                          onClick={() => setACTemperature(Math.max(16, data.airConditioner.temperature - 1))}
                          disabled={servicesState.air_cond_service !== 'on'}
                        >
                          -
                        </button>
                        <span className="mx-2">{data.airConditioner.temperature}°C</span>
                        <button
                          className="btn btn-outline-secondary py-1 bg-gray-200 rounded"
                          onClick={() => setACTemperature(Math.min(30, data.airConditioner.temperature + 1))}
                          disabled={servicesState.air_cond_service !== 'on'}
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

        {servicesState.drowsiness_service !== undefined && (
          <div className="col-12 col-lg-4">
            <div
              className={[styles.panel, 'p-4 shadow bg-white rounded', servicesState.drowsiness_service !== 'on' ? styles.blurred : ''].join(' ')}
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
                    <div className={`rounded-circle me-2 ${getDriverStatusColor()}`} style={{ width: '16px', height: '16px' }}></div>
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
                        disabled={servicesState.drowsiness_service !== 'on'}
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

        {servicesState.headlight_service !== undefined && (
          <div className="col-12 col-lg-4">
            <div
              className={[styles.panel, 'p-4 shadow bg-white rounded', servicesState.headlight_service !== 'on' ? styles.blurred : ''].join(' ')}
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
                            disabled={servicesState.headlight_service !== 'on'}
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

        {servicesState.dist_service !== undefined && (
          <div className="col-12 col-lg-4">
            <div
              className={[styles.panel, 'p-4 shadow bg-white rounded', servicesState.dist_service !== 'on' ? styles.blurred : ''].join(' ')}
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
                    {errors.dist_service ? (
                      <p className="fw-bold fs-2 mb-1 text-danger">{errors.dist_service}</p>
                    ) : (
                      <>
                        <p className="fw-bold fs-2 mb-1">{data.distance} cm</p>
                        <button
                          disabled
                          className={`rounded btn text-white ${getDistanceWarning(data.distance).class} px-3 py-1`}
                        >
                          {getDistanceWarning(data.distance).message}
                        </button>
                      </>
                    )}
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