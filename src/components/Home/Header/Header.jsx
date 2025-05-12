import { useLocation } from 'react-router-dom';
import { useUserContext } from '../../../hooks/UserContext.jsx';
import styles from './Header.module.css';
import Setting from '../../../assets/images/Setting.png';
import Notification from '../../../assets/images/Notification.png';
import defaultAvatar from '../../../assets/images/avt.jpg';

const Header = () => {
  const { userAvatar } = useUserContext();
  const location = useLocation();

  const getPageTitle = (pathname) => {
    switch (pathname) {
      case '/home':
        return 'Home';
      case '/services':
        return 'Services';
      case '/profile':
        return 'Profile';
      case '/history':
        return 'History';
      default:
        return 'Home';
    }
  };

  const pageTitle = getPageTitle(location.pathname);
  const avatarSrc = userAvatar || defaultAvatar;

  return (
    <header className={styles.wrapper}>
      <div className={styles.content}>
        <div className={styles.pageTitle}>{pageTitle}</div>
        <div className={styles.action}>
          <img src={Setting} alt="Setting" />
          <img src={Notification} alt="Notification" />
          <img
            src={avatarSrc}
            alt="Avatar"
            style={{ width: '50px', height: '50px', borderRadius: '100%' }}
          />
        </div>
      </div>
    </header>
  );
};

export default Header;