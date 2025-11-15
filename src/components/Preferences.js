import React, { useState, useEffect } from 'react';
import './Preferences.css';

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'ro', name: 'Română', flag: '🇷🇴' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
];

const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'RON', symbol: 'lei', name: 'Romanian Leu' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
];

const Preferences = ({ isOpen, onClose, onSave }) => {
  const [language, setLanguage] = useState('en');
  const [currency, setCurrency] = useState('USD');
  const [temperatureUnit, setTemperatureUnit] = useState('C');

  useEffect(() => {
    // Load preferences from localStorage
    const savedPrefs = localStorage.getItem('userPreferences');
    if (savedPrefs) {
      const prefs = JSON.parse(savedPrefs);
      setLanguage(prefs.language || 'en');
      setCurrency(prefs.currency || 'USD');
      setTemperatureUnit(prefs.temperatureUnit || 'C');
    }
  }, [isOpen]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      // Save current scroll position
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
    } else {
      // Restore scroll position
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      window.scrollTo(0, parseInt(scrollY || '0') * -1);
    }

    // Cleanup on unmount
    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleSave = () => {
    const preferences = {
      language,
      currency,
      temperatureUnit
    };
    localStorage.setItem('userPreferences', JSON.stringify(preferences));
    onSave(preferences);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="preferences-overlay" onClick={onClose}>
      <div className="preferences-modal" onClick={(e) => e.stopPropagation()}>
        <button className="preferences-close" onClick={onClose}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="preferences-header">
          <h2>⚙️ Your Preferences</h2>
          <p>Customize your travel planning experience</p>
        </div>

        <div className="preferences-body">
          {/* Language Selection */}
          <div className="preference-section">
            <label className="preference-label">🌍 Language</label>
            <p className="preference-description">Choose your preferred language for conversations</p>
            <div className="preference-grid">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  className={`preference-option ${language === lang.code ? 'active' : ''}`}
                  onClick={() => setLanguage(lang.code)}
                >
                  <span className="preference-flag">{lang.flag}</span>
                  <span className="preference-name">{lang.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Currency Selection */}
          <div className="preference-section">
            <label className="preference-label">💰 Currency</label>
            <p className="preference-description">Your preferred currency for prices</p>
            <div className="preference-grid">
              {CURRENCIES.map((curr) => (
                <button
                  key={curr.code}
                  className={`preference-option ${currency === curr.code ? 'active' : ''}`}
                  onClick={() => setCurrency(curr.code)}
                >
                  <span className="preference-symbol">{curr.symbol}</span>
                  <span className="preference-name">{curr.code}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Temperature Unit Selection */}
          <div className="preference-section">
            <label className="preference-label">🌡️ Temperature Unit</label>
            <p className="preference-description">Display temperature in</p>
            <div className="preference-toggle">
              <button
                className={`toggle-option ${temperatureUnit === 'C' ? 'active' : ''}`}
                onClick={() => setTemperatureUnit('C')}
              >
                Celsius (°C)
              </button>
              <button
                className={`toggle-option ${temperatureUnit === 'F' ? 'active' : ''}`}
                onClick={() => setTemperatureUnit('F')}
              >
                Fahrenheit (°F)
              </button>
            </div>
          </div>
        </div>

        <div className="preferences-footer">
          <button className="preferences-btn preferences-btn-cancel" onClick={onClose}>
            Cancel
          </button>
          <button className="preferences-btn preferences-btn-save" onClick={handleSave}>
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
};

export default Preferences;

