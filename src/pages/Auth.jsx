import '../components/Auth/Auth.css';
import AuthSection from '../components/Auth/AuthSection';
import landing_vid from '../assets/video/landing_vid.mp4';

function Auth() {
  return (
    <div className="main">
      <video autoPlay loop muted playsInline>
        <source src={landing_vid} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
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