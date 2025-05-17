import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import toast from 'react-hot-toast';

import apiClient from '../../services/APIClient.jsx'
import { useUserContext } from '../../hooks/UserContext.jsx';

import { ErrorMessages, SuccessMessages } from '../../utils/CommonMessages.jsx';

function LoginForm({ showSignUp }) {
  const navigate = useNavigate();
  const { setEventSource, newNotificationArrived } = useUserContext();
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    const username = document.getElementById('username_log').value;
    const password = document.getElementById('password_log').value;

    if (!username || !password) {
      toast.error(ErrorMessages.input.loginFormMissingField);
      return;
    }

    setLoading(true);
    try {
      const loginResponse = await apiClient(
        'POST',
        `${import.meta.env.VITE_SERVER_URL}/auth/login`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username, password }),
        },
      );
      console.log(`handleLogin's response:`, loginResponse);

      const source = new EventSource(`${import.meta.env.VITE_SERVER_URL}/app/events`, {
        withCredentials: true,
      });
      source.onmessage = (event) => {
        const notification = JSON.parse(event.data);
        console.log('Received SSE notification:', notification);

        newNotificationArrived(notification);
      }
      source.onerror = (error) => {
        console.log('SSE error:', error);
        setEventSource(null);
        source.close();
      }
      setEventSource(source);
      
      toast.success(SuccessMessages.auth.login);
      navigate('/home');
    }
    catch (error) {
      console.error(`handleLogin's error:`, error);
      toast.error(`${ErrorMessages.auth.login}${error.message}`);
    }
    finally {
      setLoading(false);
    }
  };

  return (
    <div id="login-form" className="form-container bg-white text-center animate-fadeIn">
      <h2 className="primary-color mb-4 auth-title">Login</h2>
      <form onSubmit={handleLogin}>
        <div className="mb-3 input-icon-container input-group">
          <label htmlFor="username_log" className="input-group-text w-40px">
            <i className="fa-solid fa-user"></i>
          </label>
          <input type="text" id="username_log" className="form-control" placeholder="Username" />
        </div>
        <div className="mb-3 input-icon-container input-group">
          <label htmlFor="password_log" className="input-group-text w-40px">
            <i className="fa-solid fa-lock"></i>
          </label>
          <input type="password" id="password_log" className="form-control" placeholder="Password" />
        </div>
        <button type="submit" className="btn-login w-100 mb-4" disabled={loading}>
          {loading ? <span className="spinner-border spinner-border-sm" role="status"></span> : 'Login'}
        </button>
        <a href="#" className="text-decoration-none toggle-auth text-primary" onClick={showSignUp}>
          Don't have an account? Sign up
        </a>
      </form>
    </div>
  );
}

export default LoginForm;
