import { GoogleLogin } from '@react-oauth/google';

export default function Landing({ onLoginSuccess, onLoginError }) {
  return (
    <div className="landing-wrap">
      <h1>Parlé</h1>
      <p>Your French Companion. Scan real-world text, practice pronunciation, and track your fluency journey.</p>
      
      <div className="auth-card">
        <h2 style={{ fontFamily: 'var(--sans)', fontSize: '1.2rem', marginBottom: '24px', color: 'var(--cream)' }}>
          Sign in to save progress
        </h2>
        
        <GoogleLogin
          onSuccess={onLoginSuccess}
          onError={onLoginError}
          theme="filled_black"
          shape="pill"
        />
      </div>
    </div>
  );
}
