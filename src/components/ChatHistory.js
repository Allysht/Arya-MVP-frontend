import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { chatAPI } from '../services/chatService';
import './ChatHistory.css';

const ChatHistory = ({ onSelectChat, onNewChat, currentChatId }) => {
  const [chats, setChats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { getToken } = useAuth();

  useEffect(() => {
    loadChats();
  }, []);

  // Public method to refresh from parent
  useEffect(() => {
    if (window.refreshChatHistory) {
      window.refreshChatHistory = loadChats;
    } else {
      window.refreshChatHistory = loadChats;
    }
  }, []);

  const loadChats = async () => {
    try {
      setIsLoading(true);
      const result = await chatAPI.getChats(getToken);
      setChats(result.chats || []);
    } catch (error) {
      console.error('Failed to load chats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteChat = async (chatId, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this chat?')) {
      return;
    }

    try {
      await chatAPI.deleteChat(chatId, getToken);
      setChats(chats.filter(chat => chat.id !== chatId));
      
      // If deleted current chat, create new one
      if (chatId === currentChatId) {
        onNewChat();
      }
    } catch (error) {
      console.error('Failed to delete chat:', error);
      alert('Failed to delete chat');
    }
  };

  const formatDate = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (isCollapsed) {
    return (
      <div className="chat-history collapsed">
        <button 
          className="expand-button"
          onClick={() => setIsCollapsed(false)}
          title="Show chat history"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="chat-history">
      <div className="chat-history-header">
        <h3>Chat History</h3>
        <div className="header-actions">
          <button 
            className="new-chat-button"
            onClick={onNewChat}
            title="New chat"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14"/>
            </svg>
          </button>
          <button 
            className="collapse-button"
            onClick={() => setIsCollapsed(true)}
            title="Hide sidebar"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </button>
        </div>
      </div>

      <div className="chat-list">
        {isLoading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading chats...</p>
          </div>
        ) : chats.length === 0 ? (
          <div className="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <p>No chats yet</p>
            <button className="start-chat-button" onClick={onNewChat}>
              Start a conversation
            </button>
          </div>
        ) : (
          chats.map((chat) => (
            <div
              key={chat.id}
              className={`chat-item ${currentChatId === chat.id ? 'active' : ''}`}
              onClick={() => onSelectChat(chat.id)}
            >
              <div className="chat-item-content">
                <h4 className="chat-title">{chat.title}</h4>
                <p className="chat-preview">{chat.preview}</p>
                <div className="chat-meta">
                  <span className="chat-date">{formatDate(chat.lastActivity)}</span>
                  <span className="chat-count">{chat.messageCount} messages</span>
                </div>
              </div>
              <button
                className="delete-chat-button"
                onClick={(e) => handleDeleteChat(chat.id, e)}
                title="Delete chat"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
              </button>
            </div>
          ))
        )}
      </div>

      <button 
        className="refresh-button"
        onClick={loadChats}
        title="Refresh chat list"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
        </svg>
        Refresh
      </button>
    </div>
  );
};

export default ChatHistory;

