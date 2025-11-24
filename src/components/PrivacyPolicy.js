import React from 'react';
import { useNavigate } from 'react-router-dom';
import './PolicyPages.css';

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="policy-page">
      <div className="policy-container">
        <button className="back-button" onClick={() => navigate('/')}>
          ← Back to Home
        </button>
        
        <h1 className="policy-title">Privacy Policy</h1>
        <p className="policy-date">Last updated: November 24, 2025</p>

        <div className="policy-content">
          <section className="policy-section">
            <h2>1. Introduction</h2>
            <p>
              Welcome to ARYA, operated by ONE CLICK TRAVEL SRL. We are committed to protecting your privacy 
              and ensuring the security of your personal information. This Privacy Policy explains how we collect, 
              use, disclose, and safeguard your information when you use our AI-powered travel planning service.
            </p>
          </section>

          <section className="policy-section">
            <h2>2. Information We Collect</h2>
            <h3>2.1 Personal Information</h3>
            <p>We may collect the following personal information:</p>
            <ul>
              <li>Name and contact information (email address, phone number)</li>
              <li>Account credentials and authentication data</li>
              <li>Travel preferences and destination interests</li>
              <li>Payment information (processed securely through third-party providers)</li>
            </ul>
            
            <h3>2.2 Usage Data</h3>
            <p>We automatically collect information about how you interact with our service:</p>
            <ul>
              <li>Device information (IP address, browser type, operating system)</li>
              <li>Usage patterns and feature interactions</li>
              <li>Travel itineraries and searches</li>
              <li>Cookies and similar tracking technologies</li>
            </ul>
          </section>

          <section className="policy-section">
            <h2>3. How We Use Your Information</h2>
            <p>We use your information to:</p>
            <ul>
              <li>Provide and improve our AI-powered travel planning services</li>
              <li>Personalize your experience and recommendations</li>
              <li>Process your requests and transactions</li>
              <li>Communicate with you about our services</li>
              <li>Analyze usage patterns to enhance our platform</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section className="policy-section">
            <h2>4. Data Sharing and Disclosure</h2>
            <p>We do not sell your personal information. We may share your data with:</p>
            <ul>
              <li>Service providers who assist in operating our platform</li>
              <li>AI technology partners for processing travel recommendations</li>
              <li>Payment processors for transaction handling</li>
              <li>Legal authorities when required by law</li>
            </ul>
          </section>

          <section className="policy-section">
            <h2>5. Data Security</h2>
            <p>
              We implement appropriate technical and organizational measures to protect your personal information 
              against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission 
              over the Internet is 100% secure.
            </p>
          </section>

          <section className="policy-section">
            <h2>6. Your Rights</h2>
            <p>You have the right to:</p>
            <ul>
              <li>Access and receive a copy of your personal data</li>
              <li>Correct inaccurate or incomplete information</li>
              <li>Request deletion of your personal data</li>
              <li>Object to or restrict certain processing activities</li>
              <li>Data portability</li>
              <li>Withdraw consent at any time</li>
            </ul>
          </section>

          <section className="policy-section">
            <h2>7. Cookies and Tracking</h2>
            <p>
              We use cookies and similar technologies to enhance your experience, analyze usage, and deliver 
              personalized content. You can control cookie preferences through your browser settings.
            </p>
          </section>

          <section className="policy-section">
            <h2>8. Children's Privacy</h2>
            <p>
              Our service is not intended for children under 16 years of age. We do not knowingly collect 
              personal information from children.
            </p>
          </section>

          <section className="policy-section">
            <h2>9. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any significant changes 
              by posting the new policy on this page and updating the "Last updated" date.
            </p>
          </section>

          <section className="policy-section">
            <h2>10. Contact Us</h2>
            <p>If you have questions about this Privacy Policy, please contact us:</p>
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

export default PrivacyPolicy;

