import default_avatar from '../assets/images/default_avatar.png';

import { createContext, useContext, useState, useEffect } from 'react';

import apiClient from '../services/APIClient.jsx';

import { IOTFields, DbDocuments, LocalStorageFields } from '../utils/CommonFields.jsx';
import { ErrorMessages } from '../utils/CommonMessages.jsx';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [userData, setUserData] = useState(() => {
    const saved = localStorage.getItem(LocalStorageFields.userData);
    return saved ? JSON.parse(saved) : null;
  });

  const [userAvatar, setUserAvatar] = useState(() => {
    const saved = localStorage.getItem(LocalStorageFields.userAvatar);
    return saved ? saved : default_avatar;
  });

  const [servicesStatus, setServicesStatus] = useState(() => {
    const saved = localStorage.getItem(LocalStorageFields.servicesStatus);
    return saved ?
      JSON.parse(saved) :
      Object.fromEntries(
        Object.keys(DbDocuments.servicesStatus)
          .map((key) => {
            if (key?.includes(IOTFields.target.service) || key?.includes(IOTFields.target.system)) {
              return [key, IOTFields.state.off];
            }
            else {
              return [key, 0];
            }
          })
      );
  });

  const [sensorsData, setSensorsData] = useState(() => {
    const saved = localStorage.getItem(LocalStorageFields.sensorsData);
    return saved ?
      JSON.parse(saved) :
      { 
        temperature: 0,
        humidity: 0,
        lightLevel: 0,
        distance: 0
      };
  });

  const [actionHistory, setActionHistory] = useState(() => {
    const saved = localStorage.getItem(LocalStorageFields.actionHistory);
    return saved ? JSON.parse(saved) : [];
  });

  const [eventSource, setEventSource] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentNotification, setCurrentNotification] = useState(null);
  const [drowsinessWarning, setDrowsinessWarning] = useState(false);

  const [isFirstLoad, setIsFirstLoad] = useState(true);

  useEffect(() => {
    const handleRefreshFail = () => {
      clearUserContext();
    };

    // For APIClient refresh token action
    window.addEventListener('refresh_fail', handleRefreshFail);

    return () => {
      window.removeEventListener('refresh_fail', handleRefreshFail);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    localStorage.setItem(LocalStorageFields.userData, JSON.stringify(userData));
  }, [userData]);

  useEffect(() => {
    localStorage.setItem(LocalStorageFields.userAvatar, userAvatar);
  }, [userAvatar]);

  useEffect(() => {
    localStorage.setItem(LocalStorageFields.servicesStatus, JSON.stringify(servicesStatus));
  }, [servicesStatus]);
  
  useEffect(() => {
    localStorage.setItem(LocalStorageFields.sensorsData, JSON.stringify(sensorsData));
  }, [sensorsData]);

  useEffect(() => {
    localStorage.setItem(LocalStorageFields.actionHistory, JSON.stringify(actionHistory));
  }, [actionHistory]);

  useEffect(() => {
    localStorage.setItem(LocalStorageFields.isFirstLoad, isFirstLoad);
  }, [isFirstLoad]);

  const initializeApp = async () => {
    try {
      const [userDataResponse, servicesResponse] = await Promise.all([
        apiClient(
          'GET',
          `${import.meta.env.VITE_SERVER_URL}/user/`,
          {
            headers: {
              'Content-Type': 'application/json'
            }
          },
        ),
        apiClient(
          'GET',
          `${import.meta.env.VITE_SERVER_URL}/app/services_status`,
          {
            headers: {
              'Content-Type': 'application/json'
            }
          },
        )
      ]);

      setUserData(userDataResponse);
      
      setServicesStatus(servicesResponse);

      setIsFirstLoad(false);
    } catch (error) {
      console.error('Error initializing app:', error);
      clearUserContext();
    }
    try {
      const userAvatarResponse = await apiClient(
        'GET',
        `${import.meta.env.VITE_SERVER_URL}/user/avatar`,
        {
          headers: {
            'Content-Type': 'multipart/blob'
          }
        },
        true
      );

      const reader = new FileReader();
      reader.onloadend = () => setUserAvatar(reader.result);
      reader.readAsDataURL(userAvatarResponse);
    }
    catch (error) {
      console.error('Error fetching user avatar:', error);
      setUserAvatar(default_avatar);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentNotification(null);
  };

  const newNotificationArrived = (newNotification) => {
    if (isModalOpen) {
      setIsModalOpen(false);
    }
    addActionHistory([newNotification]);
    setCurrentNotification(newNotification);
    setIsModalOpen(true);

    // Check for drowsiness warning
    if (newNotification.service_type === 'drowsiness' && newNotification.description.toLowerCase().includes('warning')) {
      setDrowsinessWarning(true);
      setTimeout(() => setDrowsinessWarning(false), 5000); // Reset after 5 seconds
    }
  };

  const addActionHistory = (newActions) => {
    if (newActions.length === 0) return;
    setActionHistory((prev) => [...newActions, ...(prev || [])]);
  };

  const clearUserContext = () => {
    setUserData(null);
    setUserAvatar(default_avatar);
    setServicesStatus(null);
    setSensorsData(null);
    setActionHistory(null);
    setIsFirstLoad(true);
    setDrowsinessWarning(false);

    localStorage.removeItem(LocalStorageFields.userData);
    localStorage.removeItem(LocalStorageFields.userAvatar);
    localStorage.removeItem(LocalStorageFields.servicesStatus);
    localStorage.removeItem(LocalStorageFields.sensorsData);
    localStorage.removeItem(LocalStorageFields.actionHistory);
    localStorage.removeItem(LocalStorageFields.isFirstLoad);

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
    servicesStatus,
    setServicesStatus,
    sensorsData,
    setSensorsData,
    actionHistory,
    setActionHistory,
    addActionHistory,

    eventSource,
    setEventSource,
    isModalOpen,
    setIsModalOpen,
    currentNotification,
    setCurrentNotification,
    newNotificationArrived,
    closeModal,

    clearUserContext,
    initializeApp,
    isFirstLoad,
    setIsFirstLoad,
    drowsinessWarning,
    setDrowsinessWarning,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useUserContext = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error(ErrorMessages.system.useContextError);
  }
  return context;
};