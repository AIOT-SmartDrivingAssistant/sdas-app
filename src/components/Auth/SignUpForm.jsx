import axios from "axios";

function SignUpForm({ showLogin }) {
  const handleSignUp = (e) => {
    e.preventDefault();

    const username = document.getElementById('username_reg').value;
    const password = document.getElementById('password_reg').value;
    const confirm_password = document.getElementById('confirm_password').value;

    if (password !== confirm_password) {
      alert('Passwords do not match');
      return;
    }

    const request = {
      username: username,
      password: password,
    }
    
    axios.post(`${import.meta.env.VITE_SERVER_URL}/auth/register`, request,
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    )
      .then(response => {
        console.log('Sign-up successful: ', response.data);
        showLogin();
      })
      .catch(error => {
        console.error('Error:', error);
        alert('An error occurred during sign-up');
      });
  }


    return (
      <div id="sign-up-form" className="form-container bg-white text-center">
        <h2 className="primary-color mb-4 auth-title">Sign Up</h2>
        <form onSubmit={handleSignUp}>
          <div className="mb-3 input-icon-container input-group">
            <label htmlFor="username_reg" className="input-group-text w-40px">
              <i className="fa-solid fa-user"></i>
            </label>
            <input
              type="text"
              id="username_reg"
              className="form-control"
              placeholder="Username"
            />
          </div>
          <div className="mb-3 input-icon-container input-group">
            <label htmlFor="password_reg" className="input-group-text w-40px">
              <i className="fa-solid fa-lock"></i>
            </label>
            <input
              type="password"
              id="password_reg"
              className="form-control"
              placeholder="Password"
            />
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
            />
          </div>
          <button type="submit" className="btn-login w-100 mb-4">
            Sign Up
          </button>
          <a href="#" className="text-decoration-none toggle-auth text-primary" onClick={showLogin}>
            Login
          </a>
        </form>
      </div>
    );
  }
  
  export default SignUpForm;