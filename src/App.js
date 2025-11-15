import React from 'react';
import Chat from './components/Chat';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="app-header">
        <div className="header-content">
          <div className="header-brand">
            <h1 className="app-title">ARYA</h1>
            <span className="mvp-badge">MVP</span>
          </div>
          <div className="header-actions">
            <button className="header-btn header-btn-primary">
              Sign up to save
            </button>
          </div>
        </div>
      </header>
      <main className="app-main">
        <Chat />
      </main>
    </div>
  );
}

export default App;

