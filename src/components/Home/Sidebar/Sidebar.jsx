import styles from './Sidebar.module.css';
import { NavLink, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import Robot from '../../../assets/robot.svg';
import toast from 'react-hot-toast';

const SideBar = () => {
  const navigate = useNavigate();

  const handleLogout = async (e) => {
    e.preventDefault();

    fetch(`${import.meta.env.VITE_SERVER_URL}/auth/logout`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        console.log('Logout successful:', data);
        navigate('/');
      })
      .catch((error) => {
        console.error('Logout error:', error);
        toast.error('An error occurred during logout');
      });
  };

  return (
    <nav className={styles.wrapper}>
      <div className={styles.logo}>
        <img className={styles.logoImg} src={Robot} alt=""></img>
        <div className={styles.SDA}>SDA</div>
      </div>
      <ul className={styles.list}>
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
