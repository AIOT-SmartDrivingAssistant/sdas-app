import '../components/Auth/Auth.css';
import AuthSection from '../components/Auth/AuthSection';

function Auth() {
  return (
    <div className="main">
      <div className="container-md">
        <div className="row">
          <div className="bg-overlay"></div>
          <AuthSection />
        </div>
      </div>
    </div>
  );
}

export default Auth;