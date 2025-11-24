import React from 'react';
import { useNavigate } from 'react-router-dom';
import './PolicyPages.css';

const CookiePolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="policy-page">
      <div className="policy-container">
        <button className="back-button" onClick={() => navigate('/')}>
          ← Back to Home
        </button>
        
        <h1 className="policy-title">Cookie Policy</h1>
        <p className="policy-date">Last updated: November 24, 2025</p>

        <div className="policy-content">
          <section className="policy-section">
            <h2>1. What Are Cookies</h2>
            <p>
              Cookies are small text files that are placed on your device when you visit our website. They help us 
              provide you with a better experience by remembering your preferences and understanding how you use 
              our service.
            </p>
          </section>

          <section className="policy-section">
            <h2>2. How We Use Cookies</h2>
            <p>
              ARYA, operated by ONE CLICK TRAVEL SRL, uses cookies and similar tracking technologies to enhance 
              your experience, analyze usage patterns, and improve our AI-powered travel planning service.
            </p>
          </section>

          <section className="policy-section">
            <h2>3. Types of Cookies We Use</h2>
            
            <h3>3.1 Essential Cookies</h3>
            <p>
              These cookies are necessary for the website to function properly. They enable core functionality 
              such as security, network management, and accessibility.
            </p>
            <ul>
              <li>Authentication and session management</li>
              <li>Security features</li>
              <li>Load balancing</li>
            </ul>

            <h3>3.2 Analytical/Performance Cookies</h3>
            <p>
              These cookies help us understand how visitors interact with our website by collecting and reporting 
              information anonymously.
            </p>
            <ul>
              <li>Google Analytics</li>
              <li>Usage statistics</li>
              <li>Performance monitoring</li>
            </ul>

            <h3>3.3 Functionality Cookies</h3>
            <p>
              These cookies enable enhanced functionality and personalization, such as remembering your preferences 
              and settings.
            </p>
            <ul>
              <li>Language preferences</li>
              <li>User interface customization</li>
              <li>Travel preferences</li>
            </ul>

            <h3>3.4 Targeting/Advertising Cookies</h3>
            <p>
              These cookies may be set through our site by advertising partners to build a profile of your interests 
              and show you relevant content.
            </p>
            <ul>
              <li>Personalized recommendations</li>
              <li>Marketing campaigns</li>
              <li>Retargeting</li>
            </ul>
          </section>

          <section className="policy-section">
            <h2>4. Third-Party Cookies</h2>
            <p>
              In addition to our own cookies, we may use third-party cookies to track and analyze usage, 
              provide social media features, and deliver personalized content. Third parties include:
            </p>
            <ul>
              <li>Authentication providers (Clerk)</li>
              <li>Analytics services (Google Analytics)</li>
              <li>AI service providers</li>
              <li>Payment processors</li>
            </ul>
          </section>

          <section className="policy-section">
            <h2>5. Cookie Duration</h2>
            
            <h3>5.1 Session Cookies</h3>
            <p>
              These temporary cookies are deleted when you close your browser. They help maintain your session 
              as you navigate through our website.
            </p>

            <h3>5.2 Persistent Cookies</h3>
            <p>
              These cookies remain on your device for a set period or until you delete them. They help us 
              recognize you when you return to our website.
            </p>
          </section>

          <section className="policy-section">
            <h2>6. Managing Cookies</h2>
            <p>
              You have the right to decide whether to accept or reject cookies. You can exercise your cookie 
              preferences through:
            </p>
            
            <h3>6.1 Browser Settings</h3>
            <p>
              Most web browsers allow you to control cookies through their settings. You can set your browser to:
            </p>
            <ul>
              <li>Block all cookies</li>
              <li>Block third-party cookies only</li>
              <li>Delete cookies when you close your browser</li>
              <li>Accept cookies from specific websites</li>
            </ul>

            <h3>6.2 Opt-Out Tools</h3>
            <p>You can opt out of specific tracking services:</p>
            <ul>
              <li>Google Analytics: <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer">Opt-out browser add-on</a></li>
              <li>Your browser's "Do Not Track" settings</li>
            </ul>

            <p className="note">
              <strong>Note:</strong> Blocking or deleting cookies may impact your experience and prevent you 
              from using certain features of our service.
            </p>
          </section>

          <section className="policy-section">
            <h2>7. Cookie Information</h2>
            <p>
              For more detailed information about specific cookies we use, including their duration and purpose, 
              please contact us using the information below.
            </p>
          </section>

          <section className="policy-section">
            <h2>8. Changes to This Cookie Policy</h2>
            <p>
              We may update this Cookie Policy from time to time to reflect changes in technology, legislation, 
              or our business practices. We will notify you of any significant changes by updating the 
              "Last updated" date at the top of this policy.
            </p>
          </section>

          <section className="policy-section">
            <h2>9. More Information</h2>
            <p>
              For more information about how we handle your personal data, please refer to our Privacy Policy.
            </p>
          </section>

          <section className="policy-section">
            <h2>10. Contact Us</h2>
            <p>If you have questions about our use of cookies, please contact:</p>
            <div className="company-info">
              <p><strong>ONE CLICK TRAVEL SRL</strong></p>
              <p>CUI: 51874242</p>
              <p>Nr. Reg. Com.: J2025038096009</p>
              <p>EUID: ROONRC.J2025038096009</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default CookiePolicy;

