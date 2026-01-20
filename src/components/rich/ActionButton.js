import React from 'react';
import './ActionButton.css';

const ActionButton = ({ action, onClick }) => {
  if (!action) return null;

  const handleClick = (e) => {
    if (action.type === 'link' && action.url) {
      // Let the default behavior handle the link
      return;
    }
    e.preventDefault();
    if (onClick) {
      onClick(action);
    }
  };

  // Link type - render as anchor
  if (action.type === 'link' && action.url) {
    return (
      <a
        href={action.url}
        target="_blank"
        rel="noopener noreferrer"
        className="action-button action-link"
      >
        {action.label}
        <span className="external-icon">↗</span>
      </a>
    );
  }

  // Search/suggestion type - render as button
  return (
    <button
      className={`action-button action-${action.type || 'search'}`}
      onClick={handleClick}
    >
      {action.type === 'suggestion' && <span className="suggestion-icon">💡</span>}
      {action.label}
    </button>
  );
};

export default ActionButton;
