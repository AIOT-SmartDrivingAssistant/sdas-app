import { createContext, useContext, useState, useEffect } from 'react';
import { IOTServices } from '../utils/CommonFields.jsx';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [userData, setUserData] = useState(() => {
    const saved = localStorage.getItem('userData');
    return saved ? JSON.parse(saved) : null;
  });

  const [userAvatar, setUserAvatar] = useState(() => {
    const saved = localStorage.getItem('userAvatar');
    return saved ? saved : null;
  });

  const [systemState, setSystemState] = useState(() => {
    const saved = localStorage.getItem('systemState');
    return saved ? saved : false;
  });

  const [servicesState, setServicesState] = useState(() => {
    const saved = localStorage.getItem('servicesState');
    return saved
      ? JSON.parse(saved)
      : Object.fromEntries(Object.keys(IOTServices).map((key) => [key, true]));
  });

  const [actionHistory, setActionHistory] = useState(() => {
    const saved = localStorage.getItem('actionHistory');
    return saved ? JSON.parse(saved) : [];
  });

  const [sensorData, setSensorData] = useState(() => {
    const saved = localStorage.getItem('sensorData');
    return saved
      ? JSON.parse(saved)
      : { temperature: 0, humidity: 0, lightLevel: 0, distance: 0 };
  });

  const [eventSource, setEventSource] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentNotification, setCurrentNotification] = useState(null);

  useEffect(() => {
    const handleRefreshFail = () => {
      clearUserContext();
    };

    window.addEventListener('refresh_fail', handleRefreshFail);

    return () => {
      window.removeEventListener('refresh_fail', handleRefreshFail);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    localStorage.setItem('userData', JSON.stringify(userData));
  }, [userData]);

  useEffect(() => {
    localStorage.setItem('userAvatar', userAvatar);
  }, [userAvatar]);

  useEffect(() => {
    localStorage.setItem('systemState', systemState);
  }, [systemState]);

  useEffect(() => {
    localStorage.setItem('servicesState', JSON.stringify(servicesState));
  }, [servicesState]);

  useEffect(() => {
    localStorage.setItem('actionHistory', JSON.stringify(actionHistory));
  }, [actionHistory]);

  useEffect(() => {
    localStorage.setItem('sensorData', JSON.stringify(sensorData));
  }, [sensorData]);

  const initializeApp = async () => {
    try {
      setSystemState(false);
      const [userDataResponse, userAvatarResponse, servicesResponse] =
        await Promise.all([
          fetch(`${import.meta.env.VITE_SERVER_URL}/user/`, {
            method: 'GET',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
          }),
          fetch(`${import.meta.env.VITE_SERVER_URL}/user/avatar`, {
            method: 'GET',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
          }),
          fetch(`${import.meta.env.VITE_SERVER_URL}/app/services_status`, {
            method: 'GET',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
          })
        ]);

      if (userDataResponse.ok) {
        const data = await userDataResponse.json();
        setUserData(data);
      }
      if (userAvatarResponse.ok) {
        const blob = await userAvatarResponse.blob();
        const reader = new FileReader();
        reader.onloadend = () => setUserAvatar(reader.result);
        reader.readAsDataURL(blob);
      }
      if (servicesResponse.ok) {
        const data = await servicesResponse.json();
        setServicesState(data);
      }
    } catch (error) {
      console.error('Error initializing app:', error);
      clearUserContext();
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentNotification(null);
  };

  const newNotificationArrived = (newNotification) => {
    addActionHistory([newNotification]);
    setIsModalOpen(true);
    setCurrentNotification(newNotification);
  };

  const addActionHistory = (newActions) => {
    if (newActions.length === 0) return;
    setActionHistory((prev) => [...newActions, ...prev]);
  };

  const clearUserContext = () => {
    setUserData(null);
    setUserAvatar(null);
    setSystemState(null);
    setActionHistory(null);
    setSensorData(null);
    setServicesState(null);
    localStorage.removeItem('userData');
    localStorage.removeItem('userAvatar');
    localStorage.removeItem('systemState');
    localStorage.removeItem('actionHistory');
    localStorage.removeItem('sensorData');
    localStorage.removeItem('servicesState');
    if (eventSource) {
      eventSource.close();
      setEventSource(null);
    }
  };

  const value = {
    userData,
    setUserData,
    userAvatar,
    setUserAvatar,
    systemState,
    setSystemState,
    eventSource,
    setEventSource,
    isModalOpen,
    setIsModalOpen,
    currentNotification,
    setCurrentNotification,
    actionHistory,
    setActionHistory,
    newNotificationArrived,
    addActionHistory,
    closeModal,
    servicesState,
    setServicesState,
    sensorData,
    setSensorData,
    clearUserContext,
    initializeApp,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useUserContext = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUserContext must be used within a UserProvider');
  }
  return context;
};