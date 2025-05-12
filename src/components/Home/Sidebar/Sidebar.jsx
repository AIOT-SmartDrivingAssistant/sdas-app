import styles from './Sidebar.module.css';
import { NavLink, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import Robot from '../../../assets/robot.svg';
import toast from 'react-hot-toast';
import { useUserContext } from '../../../hooks/UserContext.jsx';
import apiClient from '../../../services/APIClient.jsx';

const SideBar = () => {
  const navigate = useNavigate();
  const { systemState, setSystemState, clearUserContext } = useUserContext();

  const handleLogout = async (e) => {
    e.preventDefault();
    try {
      const logoutResponse = await apiClient(
        'POST',
        `${import.meta.env.VITE_SERVER_URL}/auth/logout`
      );

      console.log(`Logout response:`, logoutResponse);

      clearUserContext();
      toast.success(`Logout successful!`);
      navigate('/');
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleSystemToggle = async (value) => {
    const command = value ? 'on' : 'off';

    try {
      const responseData = await apiClient(
        'POST',
        `${import.meta.env.VITE_SERVER_URL}/iot/${command}`
      );

      setSystemState(value);

      console.log(`System turned ${command}:`, responseData);
      toast.success(`System turned ${command} successfully!`);
    } catch (error) {
      toast.error(`Error turning ${command} the system: ${error}`);
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
              checked={systemState}
              onChange={() => handleSystemToggle(!systemState)}
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