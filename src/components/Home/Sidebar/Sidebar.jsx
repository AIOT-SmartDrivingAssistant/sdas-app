import styles from './Sidebar.module.css';
import { NavLink, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import Robot from '../../../assets/robot.svg';
import toast from 'react-hot-toast';
import { useUserContext } from '../../../hooks/UserContext.jsx';
import { handleRefreshToken } from '../../../utils/helpers.js';

const SideBar = () => {
  const navigate = useNavigate();
  const { servicesState, setServicesState, clearUserContext, addActionToHistory } = useUserContext();

  // Kiểm tra trạng thái hệ thống (bật nếu ít nhất một dịch vụ bật)
  const isSystemOn = Object.values(servicesState).some((state) => state === 'on');

  const handleLogout = async (e) => {
    e.preventDefault();
    try {
      const logoutResponse = await fetch(`${import.meta.env.VITE_SERVER_URL}/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      const logoutResponseData = await logoutResponse.json();
      console.log(`Logout response:`, logoutResponseData);

      if (!logoutResponse.ok) {
        throw new Error(`Internal server error`);
      }

      clearUserContext();
      toast.success(`Logout successful!`);
      navigate('/');
    } catch (error) {
      console.log(`Logout error:`, error);
      toast.error(error.message);
    }
  };

  const handleSystemToggle = async (value, retry = true) => {
    const command = value ? 'on' : 'off';
    console.log(`Turning ${command} the system`);

    const prevState = { ...servicesState };
    const newServicesState = Object.fromEntries(
      Object.keys(servicesState).map((key) => [key, value ? 'on' : 'off'])
    );

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/iot/${command}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.status === 401 && retry) {
        const refreshed = await handleRefreshToken(navigate, clearUserContext);
        if (refreshed) {
          return handleSystemToggle(value, false);
        }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(`System turned ${command}:`, data);

      setServicesState(newServicesState);
      addActionToHistory('system_toggle', {
        command,
        status: 'success',
      });
      toast.success(`System turned ${command} successfully!`);
    } catch (error) {
      console.error(`Error turning ${command} the system:`, error);
      const errorMessage = error.message.includes('401')
        ? 'Unauthorized access. Please log in again.'
        : error.message.includes('400')
        ? 'Invalid request. Please try again.'
        : error.message.includes('429')
        ? 'Too many requests. Please try again later.'
        : error.name === 'AbortError'
        ? 'Request timed out. Please try again.'
        : 'Failed to update system state. Please try again later.';
      toast.error(errorMessage);
      setServicesState(prevState);
      addActionToHistory('system_toggle', {
        command,
        status: 'failed',
        error: errorMessage,
      });
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
            <div className={styles.icon}>
              <i className="fa-solid fa-power-off"></i>
            </div>
            <span>System</span>
            <input
              type="checkbox"
              className="form-check-input ms-auto"
              checked={isSystemOn}
              onChange={() => handleSystemToggle(!isSystemOn)}
            />
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