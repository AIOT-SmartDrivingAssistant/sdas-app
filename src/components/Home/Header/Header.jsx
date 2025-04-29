import { useLocation } from 'react-router-dom';
import styles from './Header.module.css'
import Setting from '../../../assets/images/Setting.png'
import Notification from '../../../assets/images/Notification.png'
import Ava from '../../../assets/images/Avatar.png'
const Header = () => {
  const location = useLocation();

  // Hàm để xác định tiêu đề dựa trên đường dẫn
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
        return 'Home'; // Mặc định nếu không khớp
    }
  };

  const pageTitle = getPageTitle(location.pathname);
  return (
    <header className={styles.wrapper}>
      <div className={styles.content}>
      <div className={styles.pageTitle}>{pageTitle}</div>
        <div className={styles.action}>
          <img src={Setting} alt ="Setting" ></img>
          <img src ={Notification} alt="Notification"></img>
          <img src ={Ava} alt="Avatar"></img>
        </div>
      </div>
    </header>
  )
}

export default Header