import Header from "./Header/Header";
import SideBar from "./Sidebar/Sidebar";
import clsx from "clsx";
import styles from "./DefaultLayout.module.css"

const DefaultLayout = ({ children }) => (
  <div className="m-0">
    <div className="container-fluid">
      <div className="row">
        <div className="col-md-2">
          <SideBar />
        </div>
        <div className="col-md-10">
          <Header />
            <div className={clsx(styles.main, "p-3")}>{children}</div>
        </div>
      </div>
    </div>
    </div>
)

export default DefaultLayout