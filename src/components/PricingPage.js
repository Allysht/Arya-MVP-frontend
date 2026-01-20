import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import './PricingPage.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function PricingPage() {
  const navigate = useNavigate();
  const { user, isLoaded, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch available plans
    const fetchPlans = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/subscription/plans`);
        if (response.data.success) {
          setPlans(response.data.plans);
        }
      } catch (error) {
        console.error('Failed to fetch plans:', error);
      }
    };

    fetchPlans();
  }, []);

  const handleSubscribe = async (plan) => {
    if (!isLoaded || !user) {
      setError('Please sign in first');
      navigate('/auth', { state: { from: { pathname: '/pricing' } } });
      return;
    }

    const email = user.email;

    if (!email) {
      setError('Unable to get your email address. Please try signing in again.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(`${API_URL}/api/subscription/create-checkout-session`, {
        firebaseUid: user.uid,
        email,
        plan
      });

      if (response.data.success && response.data.url) {
        // Redirect to Stripe checkout
        window.location.href = response.data.url;
      } else {
        setError('Failed to create checkout session');
      }
    } catch (error) {
      console.error('Subscription error:', error);
      console.error('Error response:', error.response?.data);
      setError(error.response?.data?.error || 'Failed to start subscription process');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <div className="pricing-page">
      {/* Header matching Landing Page */}
      <header className="pricing-page-header">
        <div className="pricing-container">
          <div className="header-content">
            <div className="logo-section" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
              <h1 className="logo">ARYA</h1>
              <span className="logo-badge">AI Travel</span>
            </div>
            <nav className="nav-menu">
              {!user ? (
                <button className="sign-in-button" onClick={() => navigate('/auth')}>
                  Sign In
                </button>
              ) : (
                <>
                  <button className="cta-button" onClick={() => navigate('/app')}>
                    Go to App
                  </button>
                  <div className="user-menu">
                    <span className="user-email">{user.displayName || user.email}</span>
                    <button className="sign-out-button" onClick={handleSignOut}>
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </nav>
          </div>
        </div>
      </header>

      <div className="pricing-container">
        <div className="pricing-header">
          <h1>Choose Your Plan</h1>
          <p className="pricing-subtitle">
            Unlock unlimited access to AI-powered travel planning
          </p>
        </div>

        {error && (
          <div className="error-banner">
            {error}
          </div>
        )}

        <div className="pricing-cards">
          {/* Monthly Plan */}
          <div className="pricing-card">
            <div className="plan-badge">Monthly</div>
            <div className="plan-price">
              <span className="currency">$</span>
              <span className="amount">5</span>
              <span className="period">/month</span>
            </div>
            <div className="plan-description">
              Perfect for occasional travelers
            </div>
            <ul className="plan-features">
              <li>✓ Unlimited AI chat access</li>
              <li>✓ Personalized itinerary generation</li>
              <li>✓ Save and manage trips</li>
              <li>✓ Multi-language support</li>
              <li>✓ Real-time flight & hotel search</li>
              <li>✓ Weather forecasts</li>
              <li>✓ PDF export</li>
            </ul>
            <button
              className="subscribe-button"
              onClick={() => handleSubscribe('monthly')}
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Subscribe Monthly'}
            </button>
          </div>

          {/* Yearly Plan - Featured */}
          <div className="pricing-card featured">
            <div className="plan-badge popular">Most Popular</div>
            <div className="plan-price">
              <span className="currency">$</span>
              <span className="amount">50</span>
              <span className="period">/year</span>
            </div>
            <div className="plan-description">
              <strong>Save 2 months!</strong> Best value for frequent travelers
            </div>
            <ul className="plan-features">
              <li>✓ Everything in Monthly</li>
              <li>✓ <strong>17% discount</strong> (2 months free)</li>
              <li>✓ Priority support</li>
              <li>✓ Early access to new features</li>
              <li>✓ Advanced trip planning tools</li>
              <li>✓ Unlimited saved itineraries</li>
              <li>✓ Best value for money</li>
            </ul>
            <button
              className="subscribe-button featured"
              onClick={() => handleSubscribe('yearly')}
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Subscribe Yearly'}
            </button>
            <div className="savings-badge">
              Save $10 per year
            </div>
          </div>
        </div>

        <div className="pricing-footer">
          <p>
            💳 Secure payment powered by Stripe • Cancel anytime • No hidden fees
          </p>
          <p className="money-back">
            30-day money-back guarantee
          </p>
        </div>
      </div>
    </div>
  );
}

export default PricingPage;
