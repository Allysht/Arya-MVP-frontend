import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoArrowBack } from 'react-icons/io5';
import './AffiliatePage.css';

function AffiliatePage() {
  const navigate = useNavigate();
  const widgetRef = useRef(null);

  useEffect(() => {
    // Check if script already exists
    const existingScript = document.querySelector('script[src="https://scripts.refgrowcdn.com/page.js"]');

    if (!existingScript) {
      // Load the Refgrow widget script
      const script = document.createElement('script');
      script.src = 'https://scripts.refgrowcdn.com/page.js';
      script.async = true;
      script.defer = true;
      script.onerror = () => {
        console.warn('Failed to load Refgrow widget script');
      };
      document.body.appendChild(script);
    }

    return () => {
      // Cleanup on unmount - remove any Refgrow injected content
      if (widgetRef.current) {
        widgetRef.current.innerHTML = '';
      }
    };
  }, []);

  return (
    <div className="affiliate-page">
      <div className="affiliate-background">
        <div className="affiliate-bg-shape affiliate-bg-shape-1"></div>
        <div className="affiliate-bg-shape affiliate-bg-shape-2"></div>
      </div>

      <div className="affiliate-container">
        <button className="affiliate-back-btn" onClick={() => navigate(-1)}>
          <IoArrowBack />
          Back
        </button>

        <div className="affiliate-header">
          <h1 className="affiliate-title">Affiliate Program</h1>
          <p className="affiliate-subtitle">
            Earn 40% commission on every referral. Share ARYA with your audience and get rewarded!
          </p>
        </div>

        <div className="affiliate-benefits">
          <div className="benefit-card">
            <div className="benefit-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
            </div>
            <h3>40% Commission</h3>
            <p>Earn generous commissions on every successful referral</p>
          </div>
          <div className="benefit-card">
            <div className="benefit-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <h3>Easy Sharing</h3>
            <p>Get your unique referral link and start sharing instantly</p>
          </div>
          <div className="benefit-card">
            <div className="benefit-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
              </svg>
            </div>
            <h3>Real-time Tracking</h3>
            <p>Monitor your referrals and earnings in real-time</p>
          </div>
        </div>

        <div className="affiliate-widget-container">
          <div
            ref={widgetRef}
            id="refgrow"
            data-project-id="561"
            data-lang="en"
          ></div>
        </div>
      </div>
    </div>
  );
}

export default AffiliatePage;
