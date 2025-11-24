import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { ClerkProvider, SignedIn, SignedOut, RedirectToSignIn, UserButton } from '@clerk/clerk-react';
import Chat from './components/Chat';
import ChatHistory from './components/ChatHistory';
import Preferences from './components/Preferences';
import LandingPage from './components/LandingPage';
import ItinerariesPage from './components/ItinerariesPage';
import ItineraryView from './components/ItineraryView';
import PricingPage from './components/PricingPage';
import SubscriptionRequired from './components/SubscriptionRequired';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsOfService from './components/TermsOfService';
import CookiePolicy from './components/CookiePolicy';
import { useSubscription } from './hooks/useSubscription';
import './App.css';
import { useTranslations } from './translations';

// Import Clerk publishable key
const clerkPubKey = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY;

function ChatApp() {
  const [showPreferences, setShowPreferences] = useState(false);
  const [userPreferences, setUserPreferences] = useState(null);
  const [showFirstTimePreferences, setShowFirstTimePreferences] = useState(false);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [refreshHistory, setRefreshHistory] = useState(0);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const t = useTranslations(userPreferences?.language || 'en');
  const navigate = useNavigate();
  const languageDropdownRef = useRef(null);
  const currencyDropdownRef = useRef(null);
  
  // Check subscription status
  const { loading: subLoading, hasSubscription } = useSubscription();
  
  useEffect(() => {
    // Check for successful subscription
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'true') {
      // Clear the URL params
      window.history.replaceState({}, '', '/app');
      // Show success message or reload subscription status
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  }, []);

  // Language and currency options
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

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (languageDropdownRef.current && !languageDropdownRef.current.contains(event.target)) {
        setShowLanguageDropdown(false);
      }
      if (currencyDropdownRef.current && !currencyDropdownRef.current.contains(event.target)) {
        setShowCurrencyDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePreferencesSave = (preferences) => {
    setUserPreferences(preferences);
    setShowFirstTimePreferences(false);
  };

  const updateLanguage = (langCode) => {
    const newPrefs = { ...userPreferences, language: langCode };
    setUserPreferences(newPrefs);
    localStorage.setItem('userPreferences', JSON.stringify(newPrefs));
    setShowLanguageDropdown(false);
  };

  const updateCurrency = (currencyCode) => {
    const newPrefs = { ...userPreferences, currency: currencyCode };
    setUserPreferences(newPrefs);
    localStorage.setItem('userPreferences', JSON.stringify(newPrefs));
    setShowCurrencyDropdown(false);
  };

  const toggleTemperature = () => {
    const newUnit = userPreferences?.temperatureUnit === 'C' ? 'F' : 'C';
    const newPrefs = { ...userPreferences, temperatureUnit: newUnit };
    setUserPreferences(newPrefs);
    localStorage.setItem('userPreferences', JSON.stringify(newPrefs));
  };

  const getCurrentLanguage = () => LANGUAGES.find(l => l.code === (userPreferences?.language || 'en')) || LANGUAGES[0];
  const getCurrentCurrency = () => CURRENCIES.find(c => c.code === (userPreferences?.currency || 'USD')) || CURRENCIES[0];

  const handleSelectChat = (chatId) => {
    if (window.chatComponent && window.chatComponent.loadChat) {
      window.chatComponent.loadChat(chatId);
      setCurrentChatId(chatId);
    }
  };

  const handleNewChat = () => {
    if (window.chatComponent && window.chatComponent.startNewChat) {
      window.chatComponent.startNewChat();
      setCurrentChatId(null);
    }
  };

  const handleChatCreated = (chatId) => {
    setCurrentChatId(chatId);
    setRefreshHistory(prev => prev + 1); // Trigger history refresh
    
    // Also trigger immediate refresh of chat history
    setTimeout(() => {
      if (window.refreshChatHistory) {
        window.refreshChatHistory();
      }
    }, 500); // Small delay to ensure backend has saved
  };

  return (
    <div className="App app-with-sidebar">
      {/* Chat History Sidebar */}
      <ChatHistory 
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
        currentChatId={currentChatId}
        key={refreshHistory}
      />
      
      <div className="app-main-container">
        <header className="app-header">
          <div className="header-content">
            <div className="header-brand" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
              <h1 className="app-title">ARYA</h1>
            </div>
            <div className="header-actions">
              <button 
                className="header-btn header-btn-trips" 
                onClick={() => navigate('/itineraries')}
                title="My Trips"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                  <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
                My Trips
              </button>

              {/* Preferences Controls */}
              <div className="header-preferences">
                {/* Language Selector */}
                <div className="preference-dropdown" ref={languageDropdownRef}>
                  <button 
                    className="preference-btn" 
                    onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                    title="Language"
                  >
                    <span className="preference-icon">{getCurrentLanguage().flag}</span>
                    <span className="preference-label">{getCurrentLanguage().code.toUpperCase()}</span>
                    <svg className="dropdown-arrow" width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 4.5 6 7.5 9 4.5"></polyline>
                    </svg>
                  </button>
                  {showLanguageDropdown && (
                    <div className="preference-dropdown-menu">
                      {LANGUAGES.map(lang => (
                        <button
                          key={lang.code}
                          className={`dropdown-item ${getCurrentLanguage().code === lang.code ? 'active' : ''}`}
                          onClick={() => updateLanguage(lang.code)}
                        >
                          <span className="item-icon">{lang.flag}</span>
                          <span className="item-name">{lang.name}</span>
                          {getCurrentLanguage().code === lang.code && (
                            <svg className="check-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Currency Selector */}
                <div className="preference-dropdown" ref={currencyDropdownRef}>
                  <button 
                    className="preference-btn" 
                    onClick={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
                    title="Currency"
                  >
                    <span className="preference-icon">{getCurrentCurrency().symbol}</span>
                    <span className="preference-label">{getCurrentCurrency().code}</span>
                    <svg className="dropdown-arrow" width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 4.5 6 7.5 9 4.5"></polyline>
                    </svg>
                  </button>
                  {showCurrencyDropdown && (
                    <div className="preference-dropdown-menu">
                      {CURRENCIES.map(curr => (
                        <button
                          key={curr.code}
                          className={`dropdown-item ${getCurrentCurrency().code === curr.code ? 'active' : ''}`}
                          onClick={() => updateCurrency(curr.code)}
                        >
                          <span className="item-icon">{curr.symbol}</span>
                          <span className="item-name">{curr.name}</span>
                          {getCurrentCurrency().code === curr.code && (
                            <svg className="check-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Temperature Toggle */}
                <button 
                  className="preference-btn temperature-toggle" 
                  onClick={toggleTemperature}
                  title="Temperature Unit"
                >
                  <span className="preference-icon">🌡️</span>
                  <span className="preference-label">°{userPreferences?.temperatureUnit || 'C'}</span>
                </button>
              </div>

              {/* User Profile Button */}
              <div className="user-profile-section">
                <UserButton 
                  afterSignOutUrl="/"
                  appearance={{
                    elements: {
                      avatarBox: "width: 40px; height: 40px;"
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </header>
        <main className="app-main">
          <Chat 
            userPreferences={userPreferences} 
            onChatCreated={handleChatCreated}
          />
        </main>
      </div>

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

// Protected Chat App Route with Subscription Check
function ProtectedChatApp() {
  const { loading, hasSubscription } = useSubscription();

  return (
    <>
      <SignedIn>
        {loading ? (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100vh',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            fontSize: '20px'
          }}>
            Loading...
          </div>
        ) : hasSubscription ? (
          <ChatApp />
        ) : (
          <SubscriptionRequired />
        )}
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}

// Protected Itineraries Page with Subscription Check
function ProtectedItineraries() {
  const { loading, hasSubscription } = useSubscription();

  return (
    <>
      <SignedIn>
        {loading ? (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100vh',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            fontSize: '20px'
          }}>
            Loading...
          </div>
        ) : hasSubscription ? (
          <ItinerariesPage />
        ) : (
          <SubscriptionRequired />
        )}
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}

// Protected Itinerary View with Subscription Check
function ProtectedItineraryView() {
  const { loading, hasSubscription } = useSubscription();

  return (
    <>
      <SignedIn>
        {loading ? (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100vh',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            fontSize: '20px'
          }}>
            Loading...
          </div>
        ) : hasSubscription ? (
          <ItineraryView />
        ) : (
          <SubscriptionRequired />
        )}
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}

function App() {
  if (!clerkPubKey) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Missing Clerk Publishable Key</h2>
        <p>Please add your Clerk publishable key to the .env file:</p>
        <code>REACT_APP_CLERK_PUBLISHABLE_KEY=your_key_here</code>
        <p style={{ marginTop: '20px' }}>
          Get your key from:{' '}
          <a href="https://dashboard.clerk.com" target="_blank" rel="noopener noreferrer">
            https://dashboard.clerk.com
          </a>
        </p>
      </div>
    );
  }

  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/cookie-policy" element={<CookiePolicy />} />
          <Route path="/app" element={<ProtectedChatApp />} />
          <Route path="/itineraries" element={<ProtectedItineraries />} />
          <Route path="/itineraries/:id" element={<ProtectedItineraryView />} />
        </Routes>
      </Router>
    </ClerkProvider>
  );
}

export default App;

