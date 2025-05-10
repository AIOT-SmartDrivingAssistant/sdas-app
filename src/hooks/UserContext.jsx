import { createContext, useContext, useState } from 'react';
import { IOTServices } from '../utils/CommonFields.jsx';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const [eventSource, setEventSource] = useState(null);

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

  const [SSENotification, setSSENotification] = useState([]);

  const [actionHistory, setActionHistory] = useState({
    service_toggle: [],
    user_update: [],
    avatar_update: [],
  });

  const [activityLog, setActivityLog] = useState([]);

  const addActionToHistory = (type, action) => {
    setActionHistory((prev) => {
      const newHistory = { ...prev };
      const currentActions = newHistory[type] || [];
      const newAction = { timestamp: new Date().toISOString(), ...action };
      const newActions = [newAction, ...currentActions].slice(0, 10);
      newHistory[type] = newActions;

      setActivityLog((prevLog) =>
        [{ type: 'action', actionType: type, details: newAction, timestamp: newAction.timestamp }, ...prevLog].slice(0, 40)
      );

      return newHistory;
    });
  };

  // useEffect(() => {
  //   const source = new EventSource(`${import.meta.env.VITE_SERVER_URL || 'http://localhost:3000'}/app/events`, {
  //     withCredentials: true,
  //   });

  //   source.onmessage = (event) => {
  //     const notification = JSON.parse(event.data);
  //     console.log('Received SSE notification:', notification);
  //     const timestamp = new Date().toISOString();
  //     setActivityLog((prevLog) =>
  //       [{ type: 'notification', ...notification, timestamp }, ...prevLog].slice(0, 40)
  //     );
  //   };

  //   source.onerror = (error) => {
  //     console.error('SSE error:', error);
  //   };

  //   return () => {
  //     source.close();
  //   };
  // }, []);

  const value = {
    user,
    setUser,
    eventSource,
    setEventSource,
    servicesState,
    SSENotification,
    setSSENotification,
    setServicesState,
    sensorData,
    setSensorData,
    actionHistory,
    addActionToHistory,
    activityLog,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useUserContext = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}