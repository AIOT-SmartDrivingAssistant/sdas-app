import { Fragment } from 'react'
import { Routes, Route } from 'react-router-dom'

import { publicRoutes } from './Routes'
import DefaultLayout from './components/Home'
import Auth from './pages/Auth'
import { UserProvider } from './hooks/UserContext.jsx'

function App() {
  return (
    <UserProvider>
      <div className='App'>
        <Routes>
          <Route path='/' element={<Auth />} />
          {publicRoutes.map((route, index) => {
            const Layout = route.layout === null ? Fragment : DefaultLayout
            const Page = route.component;
            return <Route key={index} path={route.path} element={<Layout><Page /></Layout>} />
          })}
        </Routes>
      </div>
    </UserProvider>
  )
}

export default App
