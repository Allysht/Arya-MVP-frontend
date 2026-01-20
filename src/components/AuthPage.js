import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { IoMail, IoLockClosed, IoPerson, IoLogoGoogle, IoAirplane, IoCheckmarkCircle, IoArrowBack, IoEye, IoEyeOff } from 'react-icons/io5';
import './AuthPage.css';

function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { login, signup, loginWithGoogle, resetPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/app';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (showForgotPassword) {
        await resetPassword(email);
        setResetSent(true);
        setLoading(false);
        return;
      }

      if (isLogin) {
        await login(email, password);
      } else {
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setError('Password must be at least 6 characters');
          setLoading(false);
          return;
        }
        await signup(email, password, displayName);
        // Track signup for affiliate program
        if (typeof window.Refgrow === 'function') {
          window.Refgrow(0, 'signup', email);
        }
      }
      navigate(from, { replace: true });
    } catch (err) {
      console.error('Auth error:', err);
      switch (err.code) {
        case 'auth/email-already-in-use':
          setError('This email is already registered. Please sign in.');
          break;
        case 'auth/invalid-email':
          setError('Invalid email address.');
          break;
        case 'auth/user-not-found':
          setError('No account found with this email.');
          break;
        case 'auth/wrong-password':
          setError('Incorrect password.');
          break;
        case 'auth/weak-password':
          setError('Password is too weak. Use at least 6 characters.');
          break;
        case 'auth/invalid-credential':
          setError('Invalid email or password.');
          break;
        default:
          setError(err.message || 'An error occurred. Please try again.');
      }
    }
    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      const result = await loginWithGoogle();
      // Track signup for affiliate program if this is a new user
      const isNewUser = result?.additionalUserInfo?.isNewUser ||
        result?._tokenResponse?.isNewUser;
      if (isNewUser && result.user?.email && typeof window.Refgrow === 'function') {
        window.Refgrow(0, 'signup', result.user.email);
      }
      navigate(from, { replace: true });
    } catch (err) {
      console.error('Google sign-in error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign-in cancelled.');
      } else {
        setError('Failed to sign in with Google. Please try again.');
      }
    }
    setLoading(false);
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setShowForgotPassword(false);
    setResetSent(false);
  };

  // Forgot Password View
  if (showForgotPassword) {
    return (
      <div className="auth-page">
        <div className="auth-background">
          <div className="auth-bg-shape auth-bg-shape-1"></div>
          <div className="auth-bg-shape auth-bg-shape-2"></div>
          <div className="auth-bg-shape auth-bg-shape-3"></div>
        </div>

        <div className="auth-container">
          <div className="auth-card">
            <div className="auth-header">
              <div className="auth-logo-section" onClick={() => navigate('/')}>
                <h1 className="auth-logo">ARYA</h1>
                <span className="auth-logo-badge">AI Travel</span>
              </div>
              <h2 className="auth-title">Reset Password</h2>
              <p className="auth-subtitle">Enter your email to receive a reset link</p>
            </div>

            {resetSent ? (
              <div className="auth-success-state">
                <div className="success-icon">
                  <IoCheckmarkCircle />
                </div>
                <h3>Check your email</h3>
                <p>We've sent a password reset link to <strong>{email}</strong></p>
                <button
                  className="auth-btn auth-btn-secondary"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setResetSent(false);
                  }}
                >
                  <IoArrowBack />
                  Back to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="auth-form">
                {error && <div className="auth-error">{error}</div>}

                <div className="input-group">
                  <div className="input-icon">
                    <IoMail />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                  />
                </div>

                <button type="submit" className="auth-btn auth-btn-primary" disabled={loading}>
                  {loading ? (
                    <span className="btn-loading">
                      <span className="spinner"></span>
                      Sending...
                    </span>
                  ) : (
                    'Send Reset Link'
                  )}
                </button>

                <button
                  type="button"
                  className="auth-back-link"
                  onClick={() => setShowForgotPassword(false)}
                >
                  <IoArrowBack />
                  Back to Sign In
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Main Auth View
  return (
    <div className="auth-page">
      <div className="auth-background">
        <div className="auth-bg-shape auth-bg-shape-1"></div>
        <div className="auth-bg-shape auth-bg-shape-2"></div>
        <div className="auth-bg-shape auth-bg-shape-3"></div>
      </div>

      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo-section" onClick={() => navigate('/')}>
              <h1 className="auth-logo">ARYA</h1>
              <span className="auth-logo-badge">AI Travel</span>
            </div>
            <h2 className="auth-title">
              {isLogin ? 'Welcome back' : 'Create account'}
            </h2>
            <p className="auth-subtitle">
              {isLogin
                ? 'Sign in to continue planning your adventures'
                : 'Start your journey with AI-powered travel planning'}
            </p>
          </div>

          {/* Google Sign In Button */}
          <button
            className="auth-btn auth-btn-google"
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            <IoLogoGoogle className="google-icon" />
            Continue with Google
          </button>

          <div className="auth-divider">
            <span>or continue with email</span>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {error && <div className="auth-error">{error}</div>}

            {!isLogin && (
              <div className="input-group">
                <div className="input-icon">
                  <IoPerson />
                </div>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                />
              </div>
            )}

            <div className="input-group">
              <div className="input-icon">
                <IoMail />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                required
              />
            </div>

            <div className="input-group">
              <div className="input-icon">
                <IoLockClosed />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                minLength={6}
              />
              <button
                type="button"
                className="input-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <IoEyeOff /> : <IoEye />}
              </button>
            </div>

            {!isLogin && (
              <div className="input-group">
                <div className="input-icon">
                  <IoLockClosed />
                </div>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  className="input-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <IoEyeOff /> : <IoEye />}
                </button>
              </div>
            )}

            {isLogin && (
              <button
                type="button"
                className="forgot-link"
                onClick={() => setShowForgotPassword(true)}
              >
                Forgot password?
              </button>
            )}

            <button type="submit" className="auth-btn auth-btn-primary" disabled={loading}>
              {loading ? (
                <span className="btn-loading">
                  <span className="spinner"></span>
                  {isLogin ? 'Signing in...' : 'Creating account...'}
                </span>
              ) : (
                <>
                  <IoAirplane />
                  {isLogin ? 'Sign In' : 'Create Account'}
                </>
              )}
            </button>
          </form>

          <div className="auth-switch">
            {isLogin ? (
              <p>Don't have an account? <button onClick={toggleMode}>Sign up</button></p>
            ) : (
              <p>Already have an account? <button onClick={toggleMode}>Sign in</button></p>
            )}
          </div>

          <div className="auth-footer">
            <p>By continuing, you agree to our <a href="/terms-of-service">Terms</a> and <a href="/privacy-policy">Privacy Policy</a></p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuthPage;
