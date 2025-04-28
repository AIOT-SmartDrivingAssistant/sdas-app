function CardTop({ isLogin }) {
    return (
      <div className="card-top d-block d-lg-none">
        <h1
          className="card-top-text"
          id="card-top-login"
          style={{ display: isLogin ? 'block' : 'none' }}
        >
          Login
        </h1>
        <h1
          className="card-top-text"
          id="card-top-signup"
          style={{ display: isLogin ? 'none' : 'block' }}
        >
          Sign Up
        </h1>
      </div>
    );
  }
  
  export default CardTop;