import 'react-range-slider-input/dist/style.css';
import styles from '../components/Home/Home.module.css';
import React, { useState, useEffect } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import apiClient from '../services/APIClient.jsx';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const DashBoard = () => {

  // Lưu trữ lịch sử dữ liệu để vẽ chart
  const [history, setHistory] = useState({
    temperature: [],
    humidity: [],
    distance: [],
    lightLevel: [],
    timestamps: [],
  });

  useEffect(() => {
    const fetchSensorData = async () => {
      try {
        const _sensorData = await apiClient(
          'GET',
          `${import.meta.env.VITE_SERVER_URL}/app/all_sensor_data`
        );
        const maxPoints = 20;

        const processSensor = (arr) => {
          if (!Array.isArray(arr)) return { values: [], labels: [] };
          // Sắp xếp theo thời gian tăng dần
          const sorted = [...arr].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
          return {
            values: sorted.map(item => item.value).slice(-maxPoints),
            labels: sorted.map(item => new Date(item.timestamp).toLocaleTimeString()).slice(-maxPoints),
          };
        };

        const temp = processSensor(_sensorData.temp);
        const humid = processSensor(_sensorData.humid);
        const dis = processSensor(_sensorData.dis);
        const lux = processSensor(_sensorData.lux);


        setHistory({
          temperature: temp.values,
          temperatureLabels: temp.labels,
          humidity: humid.values,
          humidityLabels: humid.labels,
          distance: dis.values,
          distanceLabels: dis.labels,
          lightLevel: lux.values,
          lightLevelLabels: lux.labels,
        });
      } catch (error) {
        console.error('Fail to fetch sensor data:', error);
      }
    };

    fetchSensorData();
    const intervalId = setInterval(fetchSensorData, 100000);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  // Chart data configs
  const temperatureData = {
    labels: history.temperatureLabels,
    datasets: [
      {
        label: 'Temperature (°C)',
        data: history.temperature,
        borderColor: 'rgba(255, 99, 132, 1)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        tension: 0.3,
        fill: true,
      },
    ],
  };

  const humidityData = {
    labels: history.humidityLabels,
    datasets: [
      {
        label: 'Humidity (%)',
        data: history.humidity,
        borderColor: 'rgba(54, 162, 235, 1)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        tension: 0.3,
        fill: true,
      },
    ],
  };

  const distanceData = {
    labels: history.distanceLabels,
    datasets: [
      {
        label: 'Distance (cm)',
        data: history.distance,
        borderColor: 'rgba(255, 206, 86, 1)',
        backgroundColor: 'rgba(255, 206, 86, 0.2)',
        tension: 0.3,
        fill: true,
      },
    ],
  };

  const lightLevelData = {
    labels: history.lightLevelLabels,
    datasets: [
      {
        label: 'Light Level (lux)',
        data: history.lightLevel,
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.3,
        fill: true,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: false },
    },
    scales: {
      y: { beginAtZero: true },
    },
  };

  return (
    <div className="container-fluid p-4">
      <h2 className="mb-4">Sensor Data Dashboard</h2>
      <div className="row g-4">
        <div className="col-12 col-md-6">
          <div className={[styles.panel, 'p-3 shadow bg-white rounded'].join(' ')}>
            <h5 className="mb-3">Temperature</h5>
            <Line data={temperatureData} options={chartOptions} />
          </div>
        </div>
        <div className="col-12 col-md-6">
          <div className={[styles.panel, 'p-3 shadow bg-white rounded'].join(' ')}>
            <h5 className="mb-3">Humidity</h5>
            <Line data={humidityData} options={chartOptions} />
          </div>
        </div>
        <div className="col-12 col-md-6">
          <div className={[styles.panel, 'p-3 shadow bg-white rounded'].join(' ')}>
            <h5 className="mb-3">Distance</h5>
            <Bar data={distanceData} options={chartOptions} />
          </div>
        </div>
        <div className="col-12 col-md-6">
          <div className={[styles.panel, 'p-3 shadow bg-white rounded'].join(' ')}>
            <h5 className="mb-3">Light Level</h5>
            <Line data={lightLevelData} options={chartOptions} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashBoard;