import { createContext, useContext, useState, useEffect } from 'react';
import { IOTServices } from '../utils/IOTServices.jsx';
import axios from 'axios';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [servicesState, setServicesState] = useState(() => {
    const savedState = localStorage.getItem('servicesState');
    return savedState
      ? JSON.parse(savedState)
      : Object.fromEntries(Object.keys(IOTServices).map((key) => [key, true]));
  });
  const [sensorData, setSensorData] = useState({
    temperature: 0,
    humidity: 0,
    lightLevel: 0,
    distance: 0,
  });
  const [notifications, setNotifications] = useState([]);
  const [sessionId, setSessionId] = useState(null);

  const [actionHistory, setActionHistory] = useState({
    service_toggle: [],
    user_update: [],
    avatar_update: [],
  });

  // Tạo activityLog từ notifications và actionHistory
  const [activityLog, setActivityLog] = useState([]);

  const addActionToHistory = (type, action) => {
    setActionHistory((prev) => {
      const newHistory = { ...prev };
      const currentActions = newHistory[type] || [];
      const newAction = { timestamp: new Date().toISOString(), ...action };
      const newActions = [newAction, ...currentActions].slice(0, 10);
      newHistory[type] = newActions;

      // Cập nhật activityLog khi thêm action
      setActivityLog((prevLog) => [
        { type: 'action', actionType: type, details: newAction, timestamp: newAction.timestamp },
        ...prevLog,
      ].slice(0, 40)); // Giới hạn tối đa 40 mục

      return newHistory;
    });
  };

  const addNotification = (notification) => {
    setNotifications((prev) => {
      const newNotifications = [...prev, notification];
      // Cập nhật activityLog khi có thông báo mới
      setActivityLog((prevLog) => [
        { type: 'notification', ...notification, timestamp: new Date().toISOString() },
        ...prevLog,
      ].slice(0, 40)); // Giới hạn tối đa 40 mục
      return newNotifications;
    });
  };

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) return;

      try {
        const response = await axios.get(
          `${import.meta.env.VITE_SERVER_URL || 'http://localhost:3000'}/user/`,
          {
            withCredentials: true,
            headers: { 'Content-Type': 'application/json' },
          }
        );

        if (response.status === 200) {
          console.log('Dữ liệu người dùng fetch thành công:', response.data);
          setUser(response.data);
        }
      } catch (error) {
        console.error('Lỗi khi fetch dữ liệu người dùng:', error);
      }
    };

    fetchUserData();
  }, [user]);

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
          console.log('Cấu hình dịch vụ fetch thành công:', response.data);
          setServicesState(response.data);
          localStorage.setItem('servicesState', JSON.stringify(response.data));
        }
      } catch (error) {
        console.error('Lỗi khi fetch cấu hình dịch vụ:', error);
      }
    };

    fetchServicesConfig();
  }, []);

  useEffect(() => {
    localStorage.setItem('servicesState', JSON.stringify(servicesState));
  }, [servicesState]);

  useEffect(() => {
    const source = new EventSource(
      `${import.meta.env.VITE_SERVER_URL || 'http://localhost:3000'}/app/events`,
      { withCredentials: true }
    );

    source.onmessage = (event) => {
      const notification = JSON.parse(event.data);
      console.log('Received SSE notification:', notification);
      addNotification(notification);
    };

    source.onerror = (error) => {
      console.error('SSE error:', error);
    };

    return () => {
      source.close();
    };
  }, []);

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
        activityLog, // Thêm activityLog vào context
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUserContext = () => useContext(UserContext);