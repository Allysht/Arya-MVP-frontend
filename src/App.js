import React, { useState, useEffect } from 'react';
import Chat from './components/Chat';
import Preferences from './components/Preferences';
import './App.css';
import { useTranslations } from './translations';

function App() {
  const [showPreferences, setShowPreferences] = useState(false);
  const [userPreferences, setUserPreferences] = useState(null);
  const [showFirstTimePreferences, setShowFirstTimePreferences] = useState(false);
  const t = useTranslations(userPreferences?.language || 'en');

  useEffect(() => {
    // Check if user has set preferences before
    const savedPrefs = localStorage.getItem('userPreferences');
    if (!savedPrefs) {
      // First time user - show preferences popup after a short delay
      setTimeout(() => {
        setShowFirstTimePreferences(true);
      }, 500);
    } else {
      setUserPreferences(JSON.parse(savedPrefs));
    }
  }, []);

  const handlePreferencesSave = (preferences) => {
    setUserPreferences(preferences);
    setShowFirstTimePreferences(false);
  };

  return (
    <div className="App">
      <header className="app-header">
        <div className="header-content">
          <div className="header-brand">
            <h1 className="app-title">ARYA</h1>
            <span className="mvp-badge">MVP</span>
          </div>
          <div className="header-actions">
            <button 
              className="header-btn header-btn-settings" 
              onClick={() => setShowPreferences(true)}
              title={t.settings}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg>
              {t.settings}
            </button>
          </div>
        </div>
      </header>
      <main className="app-main">
        <Chat userPreferences={userPreferences} />
      </main>

      {/* Preferences Modal */}
      <Preferences 
        isOpen={showPreferences || showFirstTimePreferences}
        onClose={() => {
          setShowPreferences(false);
          if (showFirstTimePreferences) {
            // If closing first-time popup without saving, use defaults
            const defaultPrefs = { language: 'en', currency: 'USD', temperatureUnit: 'C' };
            localStorage.setItem('userPreferences', JSON.stringify(defaultPrefs));
            setUserPreferences(defaultPrefs);
            setShowFirstTimePreferences(false);
          }
        }}
        onSave={handlePreferencesSave}
      />
    </div>
  );
}

export default App;

