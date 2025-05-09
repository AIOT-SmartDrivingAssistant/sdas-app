import { Fragment } from 'react';
import { Routes, Route } from 'react-router-dom';
import { publicRoutes } from './Routes';
import DefaultLayout from './components/Home';
import Auth from './pages/Auth';
import { UserProvider } from './hooks/UserContext.jsx';
import 'bootstrap/dist/css/bootstrap.min.css';

function AppContent() {
  return (
    <Routes>
      <Route path="/" element={<Auth />} />
      {publicRoutes.map((route, index) => {
        const Layout = route.layout === null ? Fragment : DefaultLayout;
        const Page = route.component;
        return <Route key={index} path={route.path} element={<Layout><Page /></Layout>} />;
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
    </UserProvider>
  );
}

export default App;