import { createContext, useState, useEffect } from 'react';
import { IOTServices } from '../utils/IOTServices.jsx';
import axios from 'axios';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  // Lưu trữ dữ liệu từ các request
  const [user, setUser] = useState(null); // Thông tin người dùng từ /user/
  const [servicesState, setServicesState] = useState(() => {
    const savedState = localStorage.getItem('servicesState');
    return savedState
      ? JSON.parse(savedState)
      : Object.fromEntries(Object.keys(IOTServices).map((key) => [key, true]));
  }); // Trạng thái dịch vụ từ /app/config
  const [sensorData, setSensorData] = useState({
    temperature: 0,
    humidity: 0,
    lightLevel: 0,
    distance: 0,
  }); // Dữ liệu cảm biến từ /app/sensor_data
  const [notifications, setNotifications] = useState([]); // Thông báo từ /app/events
  const [sessionId, setSessionId] = useState(null);

  // Lưu trữ action history theo loại
  const [actionHistory, setActionHistory] = useState({
    service_toggle: [], // Hành động bật/tắt dịch vụ
    user_update: [], // Hành động cập nhật thông tin người dùng
    avatar_update: [], // Hành động upload/xóa avatar
  });

  // Hàm thêm hành động vào history, giới hạn 10 hành động mỗi loại
  const addActionToHistory = (type, action) => {
    setActionHistory((prev) => {
      const newHistory = { ...prev };
      const currentActions = newHistory[type] || [];
      const newActions = [
        { timestamp: new Date().toISOString(), ...action },
        ...currentActions,
      ].slice(0, 10); // Giữ tối đa 10 hành động
      newHistory[type] = newActions;
      return newHistory;
    });
  };

  // Hàm thêm thông báo mới
  const addNotification = (notification) => {
    setNotifications((prev) => [...prev, notification]);
  };

  // Đồng bộ servicesState với server khi ứng dụng khởi động
  useEffect(() => {
    const fetchServicesConfig = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_SERVER_URL || 'http://localhost:3000'}/app/config`,
          {
            withCredentials: true,
            headers: { 'Content-Type': 'application/json' },
          }
        );

        if (response.status === 200) {
          console.log('Services config fetched on startup:', response.data);
          setServicesState(response.data);
          localStorage.setItem('servicesState', JSON.stringify(response.data));
        }
      } catch (error) {
        console.error('Error fetching services config on startup:', error);
      }
    };

    fetchServicesConfig();
  }, []);

  // Lưu servicesState vào localStorage mỗi khi nó thay đổi
  useEffect(() => {
    localStorage.setItem('servicesState', JSON.stringify(servicesState));
  }, [servicesState]);

  return (
    <UserContext.Provider
      value={{
        user,
        setUser,
        sessionId,
        setSessionId,
        servicesState,
        setServicesState,
        sensorData,
        setSensorData,
        notifications,
        addNotification,
        actionHistory,
        addActionToHistory,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};