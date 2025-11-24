import React from 'react';
import { useNavigate } from 'react-router-dom';
import './SubscriptionRequired.css';

function SubscriptionRequired() {
  const navigate = useNavigate();

  return (
    <div className="subscription-required">
      <div className="subscription-required-container">
        <div className="subscription-icon">🔒</div>
        <h1>Subscription Required</h1>
        <p className="subscription-message">
          To access ARYA's AI-powered travel planning features, you need an active subscription.
        </p>
        <div className="features-preview">
          <h3>What you'll get:</h3>
          <ul>
            <li>✨ Unlimited AI-powered chat for travel planning</li>
            <li>🗺️ Personalized itinerary generation</li>
            <li>💾 Save and manage your trips</li>
            <li>🌍 Multi-language support</li>
            <li>✈️ Real-time flight and hotel search</li>
            <li>📄 PDF export of your itineraries</li>
          </ul>
        </div>
        <div className="subscription-actions">
          <button 
            className="btn-subscribe"
            onClick={() => navigate('/pricing')}
          >
            View Pricing Plans
          </button>
          <button 
            className="btn-secondary"
            onClick={() => navigate('/')}
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}

export default SubscriptionRequired;

