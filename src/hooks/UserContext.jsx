import { createContext, useContext, useState, useEffect } from 'react';
import { IOTServices } from '../utils/IOTServices.jsx';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [servicesState, setServicesState] = useState(() => {
    const savedState = localStorage.getItem('servicesState');
    return savedState ? JSON.parse(savedState) : Object.fromEntries(Object.keys(IOTServices).map((key) => [key, true]));
  });
  const [sensorData, setSensorData] = useState({
    temperature: 0,
    humidity: 0,
    lightLevel: 0,
    distance: 0,
  });
  const [sessionId, setSessionId] = useState(null);

  const [actionHistory, setActionHistory] = useState({
    service_toggle: [],
    user_update: [],
    avatar_update: [],
  });

  const [activityLog, setActivityLog] = useState([]);

  const addActionToHistory = (type, action) => {
    // Tạo một ID duy nhất cho mỗi hành động
    const actionId = Date.now().toString() + Math.random().toString(36).substr(2, 5);
    const newAction = { id: actionId, timestamp: new Date().toISOString(), ...action };

    setActionHistory((prev) => {
      const newHistory = { ...prev };
      const currentActions = newHistory[type] || [];
      const newActions = [newAction, ...currentActions].slice(0, 10);
      newHistory[type] = newActions;

      // Thêm vào activityLog với ID duy nhất
      setActivityLog((prevLog) => {
        const existingIds = new Set(prevLog.map((item) => item.id));
        // Chỉ thêm nếu ID chưa tồn tại
        if (!existingIds.has(actionId)) {
          return [
            { id: actionId, type: 'action', actionType: type, details: newAction, timestamp: newAction.timestamp },
            ...prevLog,
          ].slice(0, 40);
        }
        return prevLog;
      });

      return newHistory;
    });
  };

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) return;

      try {
        const response = await fetch(`${import.meta.env.VITE_SERVER_URL || 'http://localhost:3000'}/user/`, {
          method: 'GET',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });

        if (response.ok) {
          const data = await response.json();
          console.log('Dữ liệu người dùng fetch thành công:', data);
          setUser(data);
        } else {
          throw new Error('Failed to fetch user data');
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
        const response = await fetch(
          `${import.meta.env.VITE_SERVER_URL || 'http://localhost:3000'}/app/services_status`,
          {
            method: 'GET',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
          },
        );

        if (response.ok) {
          const data = await response.json();
          console.log('Cấu hình dịch vụ fetch thành công:', data);
          setServicesState(data);
          localStorage.setItem('servicesState', JSON.stringify(data));
        } else {
          throw new Error('Failed to fetch services config');
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
    const source = new EventSource(`${import.meta.env.VITE_SERVER_URL || 'http://localhost:3000'}/app/events`, {
      withCredentials: true,
    });

    source.onmessage = (event) => {
      const notification = JSON.parse(event.data);
      console.log('Received SSE notification:', notification);
      const timestamp = new Date().toISOString();
      setActivityLog((prevLog) => [{ type: 'notification', ...notification, timestamp }, ...prevLog].slice(0, 40));
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
        actionHistory,
        addActionToHistory,
        activityLog,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUserContext = () => useContext(UserContext);
