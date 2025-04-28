import styles from './Header.module.css'
import Setting from '../../../assets/images/Setting.png'
import Notification from '../../../assets/images/Notification.png'
import Ava from '../../../assets/images/Avatar.png'
const Header = () => {
  return (
    <header className={styles.wrapper}>
      <div className={styles.content}>
        <div className={styles.pageTitle}>Home</div>
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