import { Fragment } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import 'bootstrap/dist/css/bootstrap.min.css';

import { publicRoutes } from './Routes';
import DefaultLayout from './components/Home';
import Auth from './pages/Auth';
import { UserProvider } from './hooks/UserContext.jsx';

import NotificationModal from './components/Modal/NotificationModal.jsx';

function AppContent() {
  return (
    <Routes>
      <Route path="/" element={<Auth />} />
      {publicRoutes.map((route, index) => {
        const Layout = route.layout === null ? Fragment : DefaultLayout;
        const Page = route.component;
        return (
          <Route
            key={index}
            path={route.path}
            element={
              <Layout>
                <Page />
              </Layout>
            }
          />
        );
      })}
    </Routes>
  );
}

function App() {
  return (
    <UserProvider>
      <div className="App">
        <AppContent />
      </div>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            icon: <i className="fa-solid fa-circle-exclamation"></i>,
            background: '#022f6c',
            color: '#fff',
            borderRadius: '8px',
            fontSize: '16px',
          },
          success: {
            icon: <i className="fa-regular fa-circle-check"></i>,
            style: {
              background: '#22c55e',
            },
          },
          error: {
            icon: <i className="fa-regular fa-circle-xmark"></i>,
            style: {
              background: '#ef4444',
            },
          },
        }}
      />
      <NotificationModal />
    </UserProvider>
  );
}

export default App;
