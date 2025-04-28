import React, { useState, useEffect } from 'react';
import styles from '../components/Home/Home.module.css'

import axios from 'axios';

import { useContext } from 'react';
import { UserContext } from '../hooks/UserContext.jsx';

import RangeSlider from 'react-range-slider-input';
import 'react-range-slider-input/dist/style.css';
import debounce from 'lodash.debounce';

import { SensorTypes, IOTServices } from '../utils/IOTServices.jsx';

const Home = () => {
  const { servicesState } = useContext(UserContext);

  const [data, setData] = useState({
    distance: 0, // cm
    temperature: 0, // Celsius
    humidity: 0, // Percentage
    lightLevel: 0, // Percentage
    incline: 0, // Degrees
    headlightsMode: "Auto", // Auto, Manual, Off
    headlightsBrightness: 0, // 1-4 (Dim, Low, Medium, High)
    driverStatus: "Alert", // Alert, Tired, Distracted
    airConditioner: {
      status: "Auto",
      temperature: 0,
    }
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Kiểm tra an toàn để tránh lỗi undefined
  const safeServicesState = servicesState;

  const handleGetSensorData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Filter sensor types based on active services
      const activeSensorTypes = [];
      if (servicesState.air_cond_service) {
        activeSensorTypes.push(SensorTypes.temp, SensorTypes.humid);
      }
      if (servicesState.headlight_service) {
        activeSensorTypes.push(SensorTypes.lux);
      }
      if (servicesState.dist_service) {
        activeSensorTypes.push(SensorTypes.dist);
      }

      // Join filtered sensor types with comma
      const sensorTypesParam = activeSensorTypes.join(',');
      
      const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/app/sensor_data`, {
        params: {
          sensor_types: sensorTypesParam
        },
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // Keep existing values if response or data is empty
      if (!response?.data?.length) {
        return;
      }

      const sensorList = response.data.slice(0, 10);
      const newData = { ...data }; // Create a copy of current data to update

      sensorList.forEach(sensor => {
        const value = parseFloat(sensor.value);
        let type = sensor.sensor_type.toString().toLowerCase().replace(/\s+|\W+/g, '');

        switch (type) {
          case SensorTypes.temp:
            newData.temperature = value;
            break;
          case SensorTypes.humid:
            newData.humidity = value;
            break;
          case SensorTypes.dist:
            newData.distance = value;
            break;
          case SensorTypes.lux:
            newData.lightLevel = value;
            break;

          default:
            break;
        }
      });

      setData(newData);
    } catch (error) {
      console.error('Error fetching sensor data:', error);
      if (error.response?.status === 401) {

        setError('Unauthorized access. Please login again.');
      } else {
        
        setError('Failed to fetch sensor data.');
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    handleGetSensorData();
    // const interval = setInterval(handleGetSensorData, 2000);
    // return () => clearInterval(interval);
  }, []);

  // Define the function to determine distance warning
  const getDistanceWarning = (distance) => {
    if (distance < 50) return { class: "bg-danger", message: "Danger" };
    if (distance < 100) return { class: "bg-warning", message: "Warning" };
    return { class: "bg-success", message: "Safe" };
  };

  // Compute the warning dynamically based on the current distance
  const distanceWarning = getDistanceWarning(data.distance);

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
        value: value[1]
      }

      const response = await axios.post(`${import.meta.env.VITE_SERVER_URL}/iot/service`, data, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response) {
        console.log(`Slider ${sliderName} API Response:`, response.data);

        // TODO: handle API response

      }

    } catch (error) {
      console.error(`Slider ${sliderName} Error:`, error.response?.data || error.message);
      
      // TODO: handle error

    }
  }, 300);

  const handleGetUserData = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/user/`, {
        withCredentials: true,
        headers: { 'Content-Type': 'application/json' },
      });

      if (response) {
        console.log('User data fetched successfully: ', response.data);

        // TODO: handle store user data
      }
    } catch (error) {
      if (error.response.status === 401) {
        // TODO: handle unauthorized error

      } else {
        // TODO: handle internal server error

      }
    }
  };

  const handleGetUserAvatar = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/user/avatar`, {
        withCredentials: true,
        headers: { 'Content-Type': 'application/json' },
      });

      if (response) {
        console.log('User avatar fetched successfully: ', response.data);

        // TODO: handle store user avatar
      }
    } catch (error) {
      if (error.response.status === 401) {
        // TODO: handle unauthorized error

      } else if (error.response.status === 404) {
        // TODO: handle not found error

      } else {
        // TODO: handle internal server error

      }
    }
  };

  const handleGetServicesConfig = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/app/config`, {
        withCredentials: true,
        headers: { 'Content-Type': 'application/json' },
      });

      if (response) {
        console.log('Services config fetched successfully: ', response.data);
      
        // TODO: handle store services config
      }
    } catch (error) {
      if (error.response.status === 401) {
        // TODO: handle unauthorized error
      
      } else {
        // TODO: handle internal server error

      }
    }
  };

  return (
    <div className="container-fluid p-0">
      {/* First Row */}
      <div className="row g-3 mb-3">
        {/* Air Conditioning Panel */}
        <div className="col-12 col-lg-4">
          <div className={[
            styles.panel,
            `p-4 shadow bg-white rounded`,
            !safeServicesState.air_cond_service ? styles.inactiveService : ''
          ].join(" ")}>
            <h4 className="mb-3">Air conditioning</h4>
            <div className='mb-3'>
              <p className='mb-1 small text-body-tertiary'>Temperature</p>
              <p className="fw-bold fs-2 mb-1">{data.temperature?.toFixed(1)}°C</p>
            </div>
            <div className='mb-3'>
              <p className='mb-1 small text-body-tertiary'>Humidity</p>
              <p className="fw-bold fs-2 mb-1">{data.humidity?.toFixed(1)}%</p>
            </div>
            {/* New version */}
            <div>
              <p className='mb-2 small text-body-tertiary'>Air conditioning</p>
              <div className='d-flex flex-wrap'>
                <button disabled={!safeServicesState.air_cond_service} 
                        className={`rounded btn text-white ${data.airConditioner?.status === 'Auto' ? 'bg-primary' : 'bg-secondary'} me-2 mb-2 px-3 py-1`}>
                  Auto
                </button>
                <button disabled={!safeServicesState.air_cond_service} 
                        className={`rounded btn text-white ${data.airConditioner?.status === 'Manual' ? 'bg-primary' : 'bg-secondary'} me-2 mb-2 px-3 py-1`}>
                  Manual
                </button>
                <button disabled={!safeServicesState.air_cond_service} 
                        className={`rounded btn text-white ${data.airConditioner?.status === 'Off' ? 'bg-primary' : 'bg-secondary'} mb-2 px-3 py-1`}>
                  Off
                </button>
              </div>
            </div>
            {/* Old version */}
            <div className='mb-2'>
              <p className='mb-2 small text-body-tertiary'>Air conditioning</p>
              <div className='d-flex flex-wrap'>
                <button className={`rounded btn text-white ${data.airConditioner?.status === 'Auto' ? 'bg-primary' : 'bg-secondary'} me-2 mb-2 px-3 py-1`}>Auto</button>
                <button className={`rounded btn text-white ${data.airConditioner?.status === 'Manual' ? 'bg-primary' : 'bg-secondary'} me-2 mb-2 px-3 py-1`}>Manual</button>
                <button className={`rounded btn text-white ${data.airConditioner?.status === 'Off' ? 'bg-primary' : 'bg-secondary'} mb-2 px-3 py-1`}>Off</button>
              </div>
              <div className="title">Air conditioning</div><RangeSlider className="Air conditioning"  value={sliderValues.airConditioner} step={20} onInput={(value) => handleSliderChange(value, IOTServices.air_cond_service)}  thumbsDisabled={[true, false]}  rangeSlideDisabled={true}/>
              <p>Current Value: {sliderValues.airConditioner[1]}</p>
            </div>
          </div>
        </div>

        {/* Distance Sensor Panel */}
        <div className="col-12 col-lg-4">
          <div className={[
            styles.panel,
            `p-4 shadow bg-white rounded`,
            !safeServicesState.dist_service ? styles.inactiveService : ''
          ].join(" ")}>
            <h4 className="mb-3">Distance Sensor</h4>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <p className="fw-bold fs-2 mb-1">{data.distance} cm</p>
                <button disabled className={`rounded btn text-white ${distanceWarning.class} px-3 py-1`}>
                  {distanceWarning.message}
                </button>
              </div>
              <div className={`${styles.distanceSensorIcon} rounded-5`}>
                <i className="fa-solid fa-bolt"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Smart Headlights Panel */}
        <div className="col-12 col-lg-4">
          <div className={[
            styles.panel,
            `p-4 shadow bg-white rounded`,
            !safeServicesState.headlight_service ? styles.inactiveService : ''
          ].join(" ")}>
            <h4 className="mb-3">Smart Headlights</h4>
            <div>
              <p className='mb-2 small text-body-tertiary'>Ambient Light Intensity</p>
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
              <div>
                <p className='mb-2 small text-body-tertiary'>Headlight Mode</p>
                <div className='d-flex flex-wrap'>
                  <button disabled={!safeServicesState.headlight_service} 
                          className={`rounded btn text-white ${data.headlightsMode === 'Auto' ? 'bg-primary' : 'bg-secondary'} me-2 mb-2 px-3 py-1`}>
                    Auto
                  </button>
                  <button disabled={!safeServicesState.headlight_service} 
                          className={`rounded btn text-white ${data.headlightsMode === 'Manual' ? 'bg-primary' : 'bg-secondary'} me-2 mb-2 px-3 py-1`}>
                    Manual
                  </button>
                  <button disabled={!safeServicesState.headlight_service} 
                          className={`rounded btn text-white ${data.headlightsMode === 'Off' ? 'bg-primary' : 'bg-secondary'} mb-2 px-3 py-1`}>
                    Off
                  </button>

                </div>
                <div className="title">Headlight </div><RangeSlider className="Headlight"  value={sliderValues.headLight} max={4} onInput={(value) => handleSliderChange(value, IOTServices.headlight_service)}  thumbsDisabled={[true, false]}  rangeSlideDisabled={true}/>
                <p>Current Value: {sliderValues.headLight[1]}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Second Row */}
      <div className="row g-3">
        {/* Driver Monitoring Panel */}
        <div className="col-12 col-lg-4">
          <div className={[
            styles.panel,
            `p-4 shadow bg-white rounded`,
            !safeServicesState.drowsiness_service ? styles.inactiveService : ''
          ].join(" ")}>
            <h4 className="mb-3">Driver Monitoring</h4>
            <div className='mb-3 d-flex align-items-center'>
              <div className="rounded-circle me-2 bg-success" style={{ width: '16px', height: '16px' }}></div>
              <p className='mb-0 fw-bold fs-4'>{data.driverStatus}</p>
            </div>
            <div className='mb-3'>
              <p className='mb-2 small text-body-tertiary'>Sleepiness Detection Sensitivity</p>
              <div className='d-flex align-items-center'>
                <span className='me-2 small'>Low</span>
                <input type='range' min='0' max='10' value='3' onChange={() => {}} 
                       className='mx-2 flex-grow-1' disabled={!safeServicesState.driver_monitoring} />
                <span className='ms-2 small'>High</span>
              </div>
            </div>
            <div className='bg-light rounded p-3'>
              <p className='fw-medium mb-2'>Recent Alerts:</p>
              <ul className="list-unstyled mb-0">
                <li className="text-muted mb-1">
                  {new Date().toLocaleTimeString()} - Driver Status: {data.driverStatus}
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Additional service panels can be added here in the future */}
        <div className="col-12 col-lg-4">
          {/* Empty slot for future service */}
        </div>
        <div className="col-12 col-lg-4">
          {/* Empty slot for future service */}
        </div>
      </div>
    </div>
  );
};

export default Home;