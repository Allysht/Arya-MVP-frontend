import React from 'react';
import './Message.css';

const Message = ({ message, onViewItinerary }) => {
  const isUser = message.role === 'user';
  const isError = message.isError;

  const formatContent = (content) => {
    // Simple markdown-like formatting
    let formatted = content;

    // Remove markdown bold syntax completely (just show the text)
    formatted = formatted.replace(/\*\*(.+?)\*\*/g, '$1');
    
    // Links
    formatted = formatted.replace(
      /\[(.+?)\]\((.+?)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
    );

    // Line breaks
    formatted = formatted.replace(/\n/g, '<br />');

    return formatted;
  };

  // Regular message rendering (no more inline itineraries)
  return (
    <div className={`message ${isUser ? 'user-message' : 'assistant-message'} ${isError ? 'error-message' : ''}`}>
      {/* Invisible anchor at the start of message for scrolling */}
      <div className="message-scroll-anchor" id={`message-${message.timestamp}`}></div>
      
      <div className="message-avatar">
        {isUser ? '👤' : '🤖'}
      </div>
      <div className="message-content">
        <div 
          className="message-text"
          dangerouslySetInnerHTML={{ __html: formatContent(message.content) }}
        />
        {message.hasItineraryButton && (
          <button 
            className="view-itinerary-btn"
            onClick={onViewItinerary}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            View Full Itinerary
          </button>
        )}
        <div className="message-timestamp">
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          })}
        </div>
      </div>
    </div>
  );
};

export default Message;

