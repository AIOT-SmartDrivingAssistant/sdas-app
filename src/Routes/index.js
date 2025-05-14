import Home from '../pages/Home'
import activityHistory from '../pages/activityHistory'
import Services from '../pages/Services'
import Profile from '../pages/Profile'
import Auth from '../pages/Auth'
import DashBoard from '../pages/DashBoard'

const publicRoutes = [
  {path: '/', component: Auth},
  {path: '/home', component: Home},
  {path: '/dashboard', component: DashBoard},
  {path: '/history', component: activityHistory},
  {path: '/services', component: Services},
  {path: '/profile', component: Profile},
]

export {publicRoutes}