import styles from './Sidebar.module.css';
import clsx from 'clsx';
import Robot from '../../../assets/robot.svg';

import { NavLink, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

import toast from 'react-hot-toast';

import apiClient from '../../../services/APIClient.jsx';
import { useUserContext } from '../../../hooks/UserContext.jsx';

import { IOTFields } from '../../../utils/CommonFields.jsx';
import { ErrorMessages, SuccessMessages } from '../../../utils/CommonMessages.jsx';

const SideBar = () => {
  const navigate = useNavigate();
  const { servicesStatus, setServicesStatus, clearUserContext } = useUserContext();

  const [systemStatus, setSystemStatus] = useState(servicesStatus?.system_status);

  // Sync systemStatus with servicesStatus.system_status
  useEffect(() => {
    if (servicesStatus?.system_status !== undefined) {
      setSystemStatus(servicesStatus.system_status);
    }
  }, [servicesStatus?.system_status]);

  useEffect(() => {
    setSystemStatus(servicesStatus?.system_status);
  }, [servicesStatus])

  const handleLogout = async (e) => {
    e.preventDefault();
    try {
      const logoutResponse = await apiClient(
        'POST',
        `${import.meta.env.VITE_SERVER_URL}/auth/logout`,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      console.log(`handleLogout's response:`, logoutResponse);

      clearUserContext();
      toast.success(SuccessMessages.auth.logout);
      navigate('/');
    } catch (error) {
      console.log(`handleLogout's error:`, error);
      toast.error(`${ErrorMessages.auth.logout}${error.message}`);
    }
  };

  const handleSystemToggle = async (value) => {
    const command = value ? IOTFields.state.on : IOTFields.state.off;
    // Check current system status before toggling
    if (servicesStatus?.system_status === command) {
      toast.info(`System is already ${command === IOTFields.state.on ? 'on' : 'off'}`);
      return;
    }

    try {
      const responseData = await apiClient(
        'POST',
        `${import.meta.env.VITE_SERVER_URL}/iot/${command}`,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      setServicesStatus((prev) => ({
        ...prev,
        ...Object.fromEntries(
          Object.keys(prev)
            .filter(key => key?.includes(IOTFields.target.service) || key?.includes(IOTFields.target.system))
            .map(key => [key, command])
        ),
      }));

      setSystemStatus(command);
      console.log(`handleSystemToggle's response:`, responseData);
      toast.success(command === IOTFields.state.on ? SuccessMessages.controlIot.systemOn : SuccessMessages.controlIot.systemOff);
    } catch (error) {
      console.error(`handleSystemToggle's error:`, error);
      setSystemStatus(servicesStatus?.system_status); // Revert to original status on error
      toast.error(`${ErrorMessages.iot.toggle}${error.message}`);
    }
  };

  return (
    <nav className={styles.wrapper}>
      <div className={styles.logo}>
        <img className={styles.logoImg} src={Robot} alt="" />
        <div className={styles.SDA}>SDA</div>
      </div>
      <ul className={styles.list}>
        <li>
          <div className={clsx(styles.sidebarLink, styles.systemToggle)}>
            <label className="form-check-label" htmlFor="switchCheckDefault">
              <div className="d-flex flex-wrap justify-content-flex-start justify-content-md-center">
                <div className={styles.icon}>
                  <i className="fa-solid fa-power-off"></i>
                </div>
                <label className="form-check-label" htmlFor="switchCheckDefault">
                  System
                </label>
                <div className="form-check form-switch" style={{ paddingLeft: '0.8rem' }}>
                  <input
                    className="form-check-input ms-auto"
                    type="checkbox"
                    checked={systemStatus === IOTFields.state.on}
                    role="switch"
                    id="switchCheckDefault"
                    onChange={() => handleSystemToggle(servicesStatus?.system_status === IOTFields.state.on ? false : true)}
                  />
                </div>
              </div>
            </label>
          </div>
        </li>
        <li>
          <NavLink to="/home" className={({ isActive }) => clsx(styles.sidebarLink, isActive ? styles.active : '')}>
            <div className={styles.icon}>
              <i className="fa-solid fa-house"></i>
            </div>
            Home
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/dashboard"
            className={({ isActive }) => clsx(styles.sidebarLink, isActive ? styles.active : '')}
          >
            <div className={styles.icon}>
              <i className="fa-solid fa-gauge"></i>
            </div>
            DashBoard
          </NavLink>
        </li>
        <li>
          <NavLink to="/history" className={({ isActive }) => clsx(styles.sidebarLink, isActive ? styles.active : '')}>
            <div className={styles.icon}>
              <i className="fa-solid fa-clock-rotate-left"></i>
            </div>
            History
          </NavLink>
        </li>
        <li>
          <NavLink to="/services" className={({ isActive }) => clsx(styles.sidebarLink, isActive ? styles.active : '')}>
            <div className={styles.icon}>
              <i className="fa-solid fa-gears"></i>
            </div>
            Services
          </NavLink>
        </li>
        <li>
          <NavLink to="/profile" className={({ isActive }) => clsx(styles.sidebarLink, isActive ? styles.active : '')}>
            <div className={styles.icon}>
              <i className="fa-solid fa-user"></i>
            </div>
            Profile
          </NavLink>
        </li>
        <li>
          <button className={styles.sidebarLink} onClick={handleLogout}>
            <div className={styles.icon}>
              <i className="fa-solid fa-right-from-bracket"></i>
            </div>
            Logout
          </button>
        </li>
      </ul>
    </nav>
  );
};

export default SideBar;