import { createContext, useState, useEffect } from 'react';

import { IOTServices } from '../utils/IOTServices.jsx';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [sessionId, setSessionId] = useState(null);

  // Khởi tạo servicesState từ localStorage hoặc giá trị mặc định
  const [servicesState, setServicesState] = useState(() => {
    const savedState = localStorage.getItem('servicesState');
    return savedState ? JSON.parse(savedState) : Object.fromEntries(
      Object.keys(IOTServices).map(key => [key, true])
    );
  });

  // Lưu servicesState vào localStorage mỗi khi nó thay đổi
  useEffect(() => {
    localStorage.setItem('servicesState', JSON.stringify(servicesState));
  }, [servicesState]);

  return (
    <UserContext.Provider value={{ user, setUser, sessionId, setSessionId, servicesState, setServicesState }}>
      {children}
    </UserContext.Provider>
  );
};