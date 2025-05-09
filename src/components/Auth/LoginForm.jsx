import { useNavigate } from 'react-router-dom';
import { useContext } from 'react';

import { UserContext } from '../../hooks/UserContext.jsx';
import { useState } from 'react';
import toast from 'react-hot-toast';

function LoginForm({ showSignUp }) {
  const navigate = useNavigate();
  const { setSessionId } = useContext(UserContext);
  const [loading, setLoading] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();

    const username = document.getElementById('username_log').value;
    const password = document.getElementById('password_log').value;

    if (!username || !password) {
      toast.error('Please enter username and password');
      return;
    }

    setLoading(true);

    fetch(`${import.meta.env.VITE_SERVER_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ username, password }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        console.log('Login successful:', data);
        setSessionId(data.setSessionId);
        toast.success('Login successful!');
        navigate('/home');
      })
      .catch((error) => {
        console.error('Login error:', error);
        toast.error('An error occurred during login');
      })
      .finally(() => setLoading(false));
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
