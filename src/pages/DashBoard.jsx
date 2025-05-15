import 'react-range-slider-input/dist/style.css';
import styles from '../components/Home/Home.module.css';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserContext } from '../hooks/UserContext.jsx';
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
  const navigate = useNavigate();
  const { initializeApp } = useUserContext();

  const [isFirstLoad, setIsFirstLoad] = useState(true);

  // Lưu trữ lịch sử dữ liệu để vẽ chart
  const [history, setHistory] = useState({
    temperature: [],
    humidity: [],
    distance: [],
    lightLevel: [],
    timestamps: [],
  });

  useEffect(() => {
    const handleInitialize = async () => {
      await initializeApp();
      setIsFirstLoad(false);
    };

    if (isFirstLoad) handleInitialize();
  }, []);

  useEffect(() => {
    const fetchSensorData = async () => {
      try {
        const _sensorData = await apiClient(
          'GET',
          `${import.meta.env.VITE_SERVER_URL}/app/all_sensor_data`
        );
        // Khởi tạo mảng lịch sử cho từng loại sensor
        const temperature = [];
        const humidity = [];
        const distance = [];
        const lightLevel = [];
        const timestamps = [];

        // Sắp xếp theo thời gian tăng dần
        const sortedData = [..._sensorData].sort(
          (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
        );

        // Gom nhóm theo timestamp, mỗi timestamp là 1 object chứa đủ 4 loại sensor nếu có
        const timeMap = {};
        sortedData.forEach((sensor) => {
          const label = new Date(sensor.timestamp).toLocaleTimeString();
          if (!timeMap[label]) timeMap[label] = {};
          timeMap[label][sensor.sensor_type.toLowerCase()] = parseFloat(sensor.value);
        });

        // Duyệt qua các timestamp đã gom nhóm, đẩy vào các mảng
        Object.entries(timeMap).forEach(([label, values]) => {
          temperature.push(values.temp ?? null);
          humidity.push(values.humid ?? null);
          distance.push(values.dis ?? null);
          lightLevel.push(values.lux ?? null);
          timestamps.push(label);
        });

        // Giới hạn số điểm hiển thị (ví dụ 20)
        const maxPoints = 20;
        setHistory({
          temperature: temperature.slice(-maxPoints),
          humidity: humidity.slice(-maxPoints),
          distance: distance.slice(-maxPoints),
          lightLevel: lightLevel.slice(-maxPoints),
          timestamps: timestamps.slice(-maxPoints),
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
    labels: history.timestamps,
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
    labels: history.timestamps,
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
    labels: history.timestamps,
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
    labels: history.timestamps,
    datasets: [
      {
        label: 'Light Level (%)',
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