import { createContext, useContext, useState } from 'react';
import { IOTServices } from '../utils/CommonFields.jsx';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [userData, setUserData] = useState(null);
  const [userAvatar, setUserAvatar] = useState(null);

  const [eventSource, setEventSource] = useState(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentNotification, setCurrentNotification] = useState(null);

  const [actionHistory, setActionHistory] = useState([]);

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentNotification(null);
  }

  const newNotificationArrived = (newNotification) => {
    addActionHistory([newNotification]);
    setIsModalOpen(true);
    setCurrentNotification(newNotification);
  }

  const addActionHistory = (newActions) => {
    if (newActions.length == 0) {
      return;
    }

    setActionHistory((prev) => {
      return [...newActions, ...prev];
    })
  }

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

  const clearUserContext = () => {
    setUserData(null);
    setUserAvatar(null);
    setActionHistory([]);
    setSensorData([]);
    setServicesState(null);

    if (eventSource) {
      eventSource.close();
      setEventSource(null);
    }
  }

  const value = {
    userData,
    setUserData,
    userAvatar,
    setUserAvatar,
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
}