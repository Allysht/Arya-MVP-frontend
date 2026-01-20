import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { IoPerson } from 'react-icons/io5';
import Chat from './components/Chat';
import ChatHistory from './components/ChatHistory';
import Preferences from './components/Preferences';
import LandingPage from './components/LandingPage';
import ItinerariesPage from './components/ItinerariesPage';
import ItineraryView from './components/ItineraryView';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsOfService from './components/TermsOfService';
import CookiePolicy from './components/CookiePolicy';
import AuthPage from './components/AuthPage';
import PricingPage from './components/PricingPage';
import AffiliatePage from './components/AffiliatePage';
import SubscriptionProtectedRoute from './components/SubscriptionProtectedRoute';
import './App.css';
import { useTranslations } from './translations';

function ChatApp() {
  const [showPreferences, setShowPreferences] = useState(false);
  const [userPreferences, setUserPreferences] = useState(null);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [refreshHistory, setRefreshHistory] = useState(0);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const t = useTranslations(userPreferences?.language || 'en');
  const navigate = useNavigate();
  const languageDropdownRef = useRef(null);
  const currencyDropdownRef = useRef(null);
  const userMenuRef = useRef(null);
  const { user, logout } = useAuth();

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
      // First time user - set default preferences silently
      const defaultPrefs = { language: 'en', currency: 'USD', temperatureUnit: 'C' };
      localStorage.setItem('userPreferences', JSON.stringify(defaultPrefs));
      setUserPreferences(defaultPrefs);
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
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePreferencesSave = (preferences) => {
    setUserPreferences(preferences);
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

  const handleSignOut = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <div className="App">
      {/* Compact Static Header - at the very top */}
      <header className="app-header">
        <div className="header-content">
          <div className="header-left">
            {/* Chat History Toggle */}
            <button
              className="header-btn header-btn-icon"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              title={isSidebarOpen ? "Hide chat history" : "Show chat history"}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </button>
            {/* New Chat Button */}
            <button
              className="header-btn header-btn-icon"
              onClick={handleNewChat}
              title="New chat"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14"/>
              </svg>
            </button>
            <div className="header-brand" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
              <h1 className="app-title">ARYA</h1>
            </div>
          </div>
          <div className="header-actions">
            <button
              className="header-btn header-btn-trips"
              onClick={() => navigate('/itineraries')}
              title="My Trips"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
              <span className="btn-label">My Trips</span>
            </button>

            {/* Language Selector */}
            <div className="preference-dropdown" ref={languageDropdownRef}>
              <button
                className="header-btn"
                onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                title="Language"
              >
                <span className="preference-icon">{getCurrentLanguage().flag}</span>
                <span className="btn-label">{getCurrentLanguage().code.toUpperCase()}</span>
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

            {/* User Menu */}
            {user && (
              <div className="user-dropdown" ref={userMenuRef}>
                <button
                  className="header-btn user-btn"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  title="Account"
                >
                  <div className="user-avatar">
                    <IoPerson className="user-avatar-icon" />
                  </div>
                </button>
                {showUserMenu && (
                  <div className="user-dropdown-menu">
                    <div className="user-info">
                      <p className="user-name">{user.displayName || 'User'}</p>
                      <p className="user-email">{user.email}</p>
                    </div>
                    <div className="dropdown-divider"></div>
                    <button className="dropdown-item" onClick={handleSignOut}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                        <polyline points="16 17 21 12 16 7"/>
                        <line x1="21" y1="12" x2="9" y2="12"/>
                      </svg>
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main content area with sidebar */}
      <div className="app-body">
        {/* Chat History Sidebar */}
        <ChatHistory
          onSelectChat={handleSelectChat}
          onNewChat={handleNewChat}
          currentChatId={currentChatId}
          key={refreshHistory}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        <div className="app-main-container">
          <main className="app-main">
            <Chat
              userPreferences={userPreferences}
              onChatCreated={handleChatCreated}
            />
          </main>
        </div>
      </div>

      {/* Preferences Modal */}
      <Preferences
        isOpen={showPreferences}
        onClose={() => setShowPreferences(false)}
        onSave={handlePreferencesSave}
      />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/affiliate" element={<AffiliatePage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/cookie-policy" element={<CookiePolicy />} />
          <Route path="/chat" element={<Navigate to="/app" replace />} />
          <Route path="/app" element={
            <SubscriptionProtectedRoute>
              <ChatApp />
            </SubscriptionProtectedRoute>
          } />
          <Route path="/itineraries" element={
            <SubscriptionProtectedRoute>
              <ItinerariesPage />
            </SubscriptionProtectedRoute>
          } />
          <Route path="/itineraries/:id" element={
            <SubscriptionProtectedRoute>
              <ItineraryView />
            </SubscriptionProtectedRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
