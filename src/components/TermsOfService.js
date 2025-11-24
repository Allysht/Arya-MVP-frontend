import React from 'react';
import { useNavigate } from 'react-router-dom';
import './PolicyPages.css';

const TermsOfService = () => {
  const navigate = useNavigate();

  return (
    <div className="policy-page">
      <div className="policy-container">
        <button className="back-button" onClick={() => navigate('/')}>
          ← Back to Home
        </button>
        
        <h1 className="policy-title">Terms of Service</h1>
        <p className="policy-date">Last updated: November 24, 2025</p>

        <div className="policy-content">
          <section className="policy-section">
            <h2>1. Agreement to Terms</h2>
            <p>
              By accessing or using ARYA, the AI-powered travel planning service operated by ONE CLICK TRAVEL SRL, 
              you agree to be bound by these Terms of Service. If you disagree with any part of these terms, 
              you may not access our service.
            </p>
          </section>

          <section className="policy-section">
            <h2>2. Description of Service</h2>
            <p>
              ARYA is an AI-powered travel planning platform that helps users create personalized travel itineraries. 
              Our service uses artificial intelligence to provide recommendations for destinations, activities, 
              accommodations, and travel experiences.
            </p>
          </section>

          <section className="policy-section">
            <h2>3. User Accounts</h2>
            <h3>3.1 Account Creation</h3>
            <p>
              To use certain features of our service, you must create an account. You agree to provide accurate, 
              current, and complete information during registration.
            </p>
            
            <h3>3.2 Account Security</h3>
            <p>
              You are responsible for maintaining the confidentiality of your account credentials and for all 
              activities that occur under your account.
            </p>
            
            <h3>3.3 Account Termination</h3>
            <p>
              We reserve the right to suspend or terminate your account if you violate these Terms of Service 
              or engage in fraudulent or illegal activities.
            </p>
          </section>

          <section className="policy-section">
            <h2>4. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul>
              <li>Use the service for any illegal or unauthorized purpose</li>
              <li>Violate any laws or regulations in your jurisdiction</li>
              <li>Interfere with or disrupt the service or servers</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Use automated systems to access the service without permission</li>
              <li>Impersonate any person or entity</li>
              <li>Transmit viruses, malware, or other harmful code</li>
            </ul>
          </section>

          <section className="policy-section">
            <h2>5. AI-Generated Content</h2>
            <p>
              ARYA uses artificial intelligence to generate travel recommendations and itineraries. While we strive 
              for accuracy, AI-generated content may not always be complete or entirely accurate. Users should verify 
              all travel information independently before making bookings or travel decisions.
            </p>
          </section>

          <section className="policy-section">
            <h2>6. Third-Party Services</h2>
            <p>
              Our service may contain links to third-party websites or services. We are not responsible for the 
              content, privacy policies, or practices of third-party services. You access third-party services 
              at your own risk.
            </p>
          </section>

          <section className="policy-section">
            <h2>7. Intellectual Property</h2>
            <p>
              The service, including its original content, features, and functionality, is owned by ONE CLICK TRAVEL SRL 
              and is protected by international copyright, trademark, and other intellectual property laws.
            </p>
          </section>

          <section className="policy-section">
            <h2>8. Payment and Subscriptions</h2>
            <h3>8.1 Fees</h3>
            <p>
              Certain features of our service may require payment. All fees are non-refundable unless otherwise 
              stated or required by law.
            </p>
            
            <h3>8.2 Billing</h3>
            <p>
              By providing payment information, you authorize us to charge the applicable fees to your payment method. 
              You are responsible for maintaining valid payment information.
            </p>
          </section>

          <section className="policy-section">
            <h2>9. Disclaimers</h2>
            <p>
              THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND. WE DO NOT WARRANT 
              THAT THE SERVICE WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE. TRAVEL RECOMMENDATIONS ARE FOR 
              INFORMATIONAL PURPOSES ONLY.
            </p>
          </section>

          <section className="policy-section">
            <h2>10. Limitation of Liability</h2>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, ONE CLICK TRAVEL SRL SHALL NOT BE LIABLE FOR ANY INDIRECT, 
              INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE SERVICE.
            </p>
          </section>

          <section className="policy-section">
            <h2>11. Indemnification</h2>
            <p>
              You agree to indemnify and hold harmless ONE CLICK TRAVEL SRL from any claims, damages, losses, 
              liabilities, and expenses arising from your use of the service or violation of these terms.
            </p>
          </section>

          <section className="policy-section">
            <h2>12. Changes to Terms</h2>
            <p>
              We reserve the right to modify these Terms of Service at any time. We will notify users of significant 
              changes. Your continued use of the service after changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section className="policy-section">
            <h2>13. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of Romania, without 
              regard to its conflict of law provisions.
            </p>
          </section>

          <section className="policy-section">
            <h2>14. Contact Information</h2>
            <p>For questions about these Terms of Service, please contact:</p>
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

export default TermsOfService;

