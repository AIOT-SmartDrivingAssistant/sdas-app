import { useState } from 'react';
import LoginForm from './LoginForm';
import SignUpForm from './SignUpForm';
import CardTop from './CardTop';
import TextOverlay from './TextOverlay';

function AuthSection() {
  const [isLogin, setIsLogin] = useState(true);

  const showSignUp = () => setIsLogin(false);
  const showLogin = () => setIsLogin(true);

  return (
    <div className="auth-section">
      <div className="row justify-content-around align-items-center">
        <CardTop isLogin={isLogin} />
        <TextOverlay />
        <div className="col-md-5 login-area">
          {isLogin ? (
            <LoginForm showSignUp={showSignUp} />
          ) : (
            <SignUpForm showLogin={showLogin} />
          )}
        </div>
      </div>
    </div>
  );
}

export default AuthSection;