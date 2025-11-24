import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { itineraryAPI } from '../services/chatService';
import './ItinerariesPage.css';

const ItinerariesPage = () => {
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [itineraries, setItineraries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('recent'); // recent, oldest, name

  useEffect(() => {
    fetchItineraries();
  }, []);

  const fetchItineraries = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await itineraryAPI.getItineraries(getToken);
      const itinerariesArray = data?.itineraries || [];
      setItineraries(itinerariesArray);
      console.log('✅ Loaded', itinerariesArray.length, 'itineraries');
    } catch (err) {
      console.error('Failed to load itineraries:', err);
      setError('Failed to load your trips');
      setItineraries([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (itineraryId, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this trip?')) {
      return;
    }

    try {
      await itineraryAPI.deleteItinerary(itineraryId, getToken);
      setItineraries(itineraries.filter(it => it._id !== itineraryId));
      console.log('✅ Deleted itinerary:', itineraryId);
    } catch (err) {
      console.error('Failed to delete itinerary:', err);
      alert('Failed to delete trip');
    }
  };

  const handleViewItinerary = (itinerary) => {
    navigate(`/itineraries/${itinerary._id}`);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const getSortedItineraries = () => {
    const sorted = [...itineraries];
    switch (sortBy) {
      case 'oldest':
        return sorted.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      case 'name':
        return sorted.sort((a, b) => (a.destination || '').localeCompare(b.destination || ''));
      case 'recent':
      default:
        return sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
  };

  const sortedItineraries = getSortedItineraries();

  // Calculate stats
  const totalTrips = itineraries.length;
  const totalDays = itineraries.reduce((sum, it) => sum + (it.summary?.totalDays || 0), 0);
  const uniqueDestinations = new Set(itineraries.map(it => it.destination)).size;

  if (loading) {
    return (
      <div className="itineraries-page">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading your adventures...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="itineraries-page">
        <div className="error-state">
          <p>{error}</p>
          <button onClick={fetchItineraries} className="retry-btn">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="itineraries-page">
      <div className="itineraries-container">
        {/* Hero Section */}
        <div className="itineraries-hero">
          <div className="hero-content">
            <h1 className="hero-title">My Trips</h1>
            <p className="hero-subtitle">
              {totalTrips === 0 
                ? 'Start planning your next adventure'
                : `${totalTrips} ${totalTrips === 1 ? 'adventure' : 'adventures'} planned`
              }
            </p>
          </div>

          {totalTrips > 0 && (
            <div className="stats-row">
              <div className="stat-card">
                <div className="stat-icon">🌍</div>
                <div className="stat-info">
                  <div className="stat-value">{totalTrips}</div>
                  <div className="stat-label">{totalTrips === 1 ? 'Trip' : 'Trips'}</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">📍</div>
                <div className="stat-info">
                  <div className="stat-value">{uniqueDestinations}</div>
                  <div className="stat-label">{uniqueDestinations === 1 ? 'Destination' : 'Destinations'}</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🌙</div>
                <div className="stat-info">
                  <div className="stat-value">{totalDays}</div>
                  <div className="stat-label">{totalDays === 1 ? 'Day' : 'Days'}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        {totalTrips > 0 && (
          <div className="controls-bar">
            <div className="sort-controls">
              <label>Sort by:</label>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="recent">Most Recent</option>
                <option value="oldest">Oldest First</option>
                <option value="name">Destination A-Z</option>
              </select>
            </div>
            <button onClick={() => navigate('/app')} className="new-trip-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              New Trip
            </button>
          </div>
        )}

        {/* Trips Grid or Empty State */}
        {sortedItineraries.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">✈️</div>
            <h2>No trips yet</h2>
            <p>Ready to explore the world? Start planning your first adventure with ARYA.</p>
            <button onClick={() => navigate('/app')} className="create-trip-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              Create Your First Trip
            </button>
          </div>
        ) : (
          <div className="itineraries-grid">
            {sortedItineraries.map((itinerary) => (
              <div 
                key={itinerary._id} 
                className="itinerary-card"
                onClick={() => handleViewItinerary(itinerary)}
              >
                {/* Card Image Header */}
                <div className="card-image-header">
                  <div className="destination-overlay">
                    <span className="destination-name">{itinerary.destination}</span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="card-body">
                  <h3 className="trip-title">{itinerary.title || `Trip to ${itinerary.destination}`}</h3>
                  
                  {itinerary.description && (
                    <p className="trip-description">{itinerary.description}</p>
                  )}

                  <div className="trip-details">
                    {itinerary.startDate && itinerary.endDate && (
                      <div className="detail-item">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                          <path d="M16 2v4M8 2v4M3 10h18"/>
                        </svg>
                        <span>{formatDate(itinerary.startDate)} - {formatDate(itinerary.endDate)}</span>
                      </div>
                    )}
                    
                    {itinerary.summary?.totalDays && (
                      <div className="detail-item">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"/>
                          <path d="M12 6v6l4 2"/>
                        </svg>
                        <span>{itinerary.summary.totalDays} {itinerary.summary.totalDays === 1 ? 'day' : 'days'}</span>
                      </div>
                    )}
                  </div>

                  {itinerary.summary?.highlights && itinerary.summary.highlights.length > 0 && (
                    <div className="highlights">
                      {itinerary.summary.highlights.slice(0, 3).map((highlight, idx) => (
                        <span key={idx} className="highlight-tag">{highlight}</span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Card Footer */}
                <div className="card-footer">
                  <span className="created-date">
                    Created {formatDate(itinerary.createdAt)}
                  </span>
                  <div className="card-actions">
                    <button
                      className="action-btn delete-btn"
                      onClick={(e) => handleDelete(itinerary._id, e)}
                      title="Delete trip"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ItinerariesPage;
