import React from 'react';
import './Message.css';
import {
  FlightResults,
  HotelResults,
  RestaurantResults,
  AttractionResults,
  ActionButton
} from './rich';

/**
 * Parse structured response from talker.js
 * Returns parsed object or null if plain text
 */
function parseStructuredResponse(content) {
  if (!content) return null;

  // If already an object with the expected shape
  if (typeof content === 'object' && content.type && content.message) {
    return content;
  }

  // Try to parse JSON from string
  if (typeof content === 'string') {
    const trimmed = content.trim();

    // Check if content contains JSON (might start with { or have JSON embedded)
    if (trimmed.includes('{"type":')) {
      try {
        // Find the JSON object in the string (in case there's text before/after)
        const jsonMatch = trimmed.match(/\{[\s\S]*"type"[\s\S]*"message"[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.type && parsed.message) {
            return parsed;
          }
        }
      } catch (e) {
        // Try direct parse as fallback
        try {
          if (trimmed.startsWith('{')) {
            const parsed = JSON.parse(trimmed);
            if (parsed.type && parsed.message) {
              return parsed;
            }
          }
        } catch (e2) {
          // Not valid JSON
        }
      }
    } else if (trimmed.startsWith('{')) {
      // Direct JSON that doesn't have "type" might be old format
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed.type && parsed.message) {
          return parsed;
        }
      } catch (e) {
        // Not valid JSON, treat as plain text
      }
    }
  }

  // Plain text - return null to use default rendering
  return null;
}

/**
 * Get the text content from a message
 * Handles both structured JSON responses and plain text
 */
function getMessageText(content) {
  if (!content) return '';

  // First, try to parse as structured response
  const structured = parseStructuredResponse(content);
  if (structured && structured.message) {
    return structured.message.text || '';
  }

  // If it's a string that looks like JSON but failed to parse properly,
  // try to extract just the text part
  if (typeof content === 'string') {
    const trimmed = content.trim();

    // Check if it looks like our JSON format
    if (trimmed.includes('"text":')) {
      try {
        // Try to extract the text value directly using regex
        const textMatch = trimmed.match(/"text"\s*:\s*"((?:[^"\\]|\\.)*)"/);
        if (textMatch && textMatch[1]) {
          // Unescape the JSON string
          return JSON.parse(`"${textMatch[1]}"`);
        }
      } catch (e) {
        // Fallback to returning the whole string
      }
    }

    return trimmed;
  }

  return '';
}

const Message = ({ message, onViewItinerary, onAction }) => {
  const isUser = message.role === 'user';
  const isError = message.isError;

  // Parse structured response
  const structuredContent = parseStructuredResponse(message.content);
  let messageText = getMessageText(message.content);

  // Safety check: if messageText still looks like raw JSON, extract just the text
  if (messageText && messageText.includes('{"type":')) {
    console.warn('Message still contains JSON after parsing, attempting extraction');
    try {
      const parsed = JSON.parse(messageText);
      if (parsed.message?.text) {
        messageText = parsed.message.text;
      }
    } catch (e) {
      // Try regex extraction as last resort
      const textMatch = messageText.match(/"text"\s*:\s*"([^"]+)"/);
      if (textMatch) {
        messageText = textMatch[1];
      }
    }
  }

  const formatContent = (content) => {
    if (!content || typeof content !== 'string') return '';

    let formatted = content;

    // Bold text
    formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

    // Links
    formatted = formatted.replace(
      /\[(.+?)\]\((.+?)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
    );

    // Line breaks
    formatted = formatted.replace(/\n/g, '<br />');

    return formatted;
  };

  // Render rich components based on type
  const renderComponent = (component, index) => {
    if (!component || !component.type) return null;

    switch (component.type) {
      case 'flight_results':
        return <FlightResults key={index} data={component.data} />;
      case 'hotel_results':
        return <HotelResults key={index} data={component.data} />;
      case 'restaurant_results':
        return <RestaurantResults key={index} data={component.data} />;
      case 'attraction_results':
        return <AttractionResults key={index} data={component.data} />;
      default:
        return null;
    }
  };

  // Handle action button click
  const handleActionClick = (action) => {
    if (onAction) {
      onAction(action);
    }
  };

  return (
    <div className={`message ${isUser ? 'user-message' : 'assistant-message'} ${isError ? 'error-message' : ''}`}>
      {/* Invisible anchor at the start of message for scrolling */}
      <div className="message-scroll-anchor" id={`message-${message.timestamp}`}></div>

      <div className="message-avatar">
        {isUser ? '👤' : '🤖'}
      </div>

      <div className="message-content">
        {/* Text message */}
        <div
          className="message-text"
          dangerouslySetInnerHTML={{ __html: formatContent(messageText) }}
        />

        {/* Rich components */}
        {structuredContent?.components && structuredContent.components.length > 0 && (
          <div className="rich-components">
            {structuredContent.components.map((comp, idx) => renderComponent(comp, idx))}
          </div>
        )}

        {/* Action buttons */}
        {structuredContent?.actions && structuredContent.actions.length > 0 && (
          <div className="action-buttons">
            {structuredContent.actions.map((action, idx) => (
              <ActionButton
                key={idx}
                action={action}
                onClick={handleActionClick}
              />
            ))}
          </div>
        )}

        {/* Itinerary button (legacy support) */}
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
