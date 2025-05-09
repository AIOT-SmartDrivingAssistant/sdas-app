import { useState } from 'react';
import toast from 'react-hot-toast';

function SignUpForm({ showLogin }) {
  const [loading, setLoading] = useState(false);

  const handleSignUp = (e) => {
    e.preventDefault();
    setLoading(true);

    const username = document.getElementById('username_reg').value;
    const password = document.getElementById('password_reg').value;
    const confirm_password = document.getElementById('confirm_password').value;

    // Validate username
    if (!/^[a-zA-Z0-9_]{3,50}$/.test(username)) {
      toast.error('Username must be 3-50 characters and only contain letters, numbers, and underscore');
      setLoading(false);
      return;
    }

    // Validate password
    if (password.length < 8 || password.length > 128) {
      toast.error('Password must be 8-128 characters');
      setLoading(false);
      return;
    }

    if (password !== confirm_password) {
      toast.error('Passwords do not match');
      setLoading(false);
      return;
    }

    const request = {
      username: username,
      password: password,
    };

    fetch(`${import.meta.env.VITE_SERVER_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(request),
    })
      .then(async (response) => {
        if (!response.ok) {
          // Đọc nội dung lỗi từ response
          const errorData = await response.json();

          // Tạo thông báo lỗi dựa trên mã trạng thái và nội dung lỗi
          let errorMessage = 'An error occurred during sign-up';
          if (response.status === 409) {
            errorMessage = 'Username already exists. Please choose another username.';
          } else if (errorData.detail) {
            errorMessage = errorData.detail;
          }

          throw new Error(errorMessage);
        }
        return response.json();
      })
      .then((data) => {
        console.log('Sign-up successful: ', data);
        toast.success('Sign up successful!');
        showLogin();
      })
      .catch((error) => {
        console.error('Error:', error);
        toast.error(error.message);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <div id="sign-up-form" className="form-container bg-white text-center animate-fadeIn">
      <h2 className="primary-color mb-4 auth-title">Sign Up</h2>
      <form onSubmit={handleSignUp}>
        <div className="mb-3 input-icon-container input-group">
          <label htmlFor="username_reg" className="input-group-text w-40px">
            <i className="fa-solid fa-user"></i>
          </label>
          <input type="text" id="username_reg" className="form-control" placeholder="Username" disabled={loading} />
        </div>
        <div className="mb-3 input-icon-container input-group">
          <label htmlFor="password_reg" className="input-group-text w-40px">
            <i className="fa-solid fa-lock"></i>
          </label>
          <input type="password" id="password_reg" className="form-control" placeholder="Password" disabled={loading} />
        </div>
        <div className="mb-3 input-icon-container input-group">
          <label htmlFor="confirm_password" className="input-group-text w-40px">
            <i className="fa-solid fa-lock"></i>
          </label>
          <input
            type="password"
            id="confirm_password"
            className="form-control"
            placeholder="Confirm Password"
            disabled={loading}
          />
        </div>
        <button type="submit" className="btn-login w-100 mb-4" disabled={loading}>
          {loading ? <span className="spinner-border spinner-border-sm" role="status"></span> : 'Sign Up'}
        </button>
        <a href="#" className="text-decoration-none toggle-auth text-primary" onClick={showLogin}>
          Login
        </a>
      </form>
    </div>
  );
}

export default SignUpForm;
