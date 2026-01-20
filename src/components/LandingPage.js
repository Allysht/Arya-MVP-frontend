import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoSparkles, IoFlash, IoGlobe, IoBulb, IoPhonePortrait, IoWallet, IoAirplane, IoStar, IoPerson, IoBriefcase } from 'react-icons/io5';
import './LandingPage.css';

const LandingPage = () => {
  const navigate = useNavigate();
  const [currentImageSet, setCurrentImageSet] = useState(0);

  // Stunning travel images for carousel - high quality destinations
  const carouselImages = [
    {
      url: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1600',
      title: 'Mountain Adventures',
      location: 'Swiss Alps'
    },
    {
      url: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1600',
      title: 'Tropical Paradise',
      location: 'Maldives'
    },
    {
      url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600',
      title: 'Beach Escapes',
      location: 'Seychelles'
    },
    {
      url: 'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?w=1600',
      title: 'Urban Exploration',
      location: 'Santorini, Greece'
    },
    {
      url: 'https://images.unsplash.com/photo-1530521954074-e64f6810b32d?w=1600',
      title: 'Desert Wonders',
      location: 'Morocco'
    },
    {
      url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600',
      title: 'Northern Lights',
      location: 'Iceland'
    },
    {
      url: 'https://images.unsplash.com/photo-1476900543704-4312b78632f8?w=1600',
      title: 'Island Dreams',
      location: 'Bali, Indonesia'
    },
    {
      url: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1600',
      title: 'City Lights',
      location: 'Dubai'
    },
    {
      url: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1600',
      title: 'Nature Retreats',
      location: 'New Zealand'
    },
    {
      url: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1600',
      title: 'Cultural Journey',
      location: 'Kyoto, Japan'
    },
    {
      url: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1600',
      title: 'Safari Adventure',
      location: 'Tanzania'
    },
    {
      url: 'https://images.unsplash.com/photo-1527004013197-933c4bb611b3?w=1600',
      title: 'Ancient Wonders',
      location: 'Machu Picchu'
    }
  ];

  // Reviews data
  const reviews = [
    {
      name: 'Sarah Johnson',
      location: 'New York, USA',
      rating: 5,
      text: 'ARYA made planning my European trip so effortless! The AI understood exactly what I wanted and created the perfect itinerary in minutes.',
      avatar: 'business-woman'
    },
    {
      name: 'Michael Chen',
      location: 'Singapore',
      rating: 5,
      text: 'I was skeptical at first, but this AI travel planner exceeded all my expectations. Best trip planning experience ever!',
      avatar: 'tech-person'
    },
    {
      name: 'Emma Rodriguez',
      location: 'Barcelona, Spain',
      rating: 5,
      text: 'As a frequent traveler, ARYA has become my go-to tool. It saves me hours of research and always finds hidden gems.',
      avatar: 'traveler'
    },
    {
      name: 'David Kim',
      location: 'Seoul, South Korea',
      rating: 5,
      text: 'The personalized recommendations are spot-on! ARYA truly understands travel preferences.',
      avatar: '🌏'
    }
  ];

  // Auto-rotate carousel - slower for appreciation
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageSet((prev) => (prev + 1) % carouselImages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [carouselImages.length]);

  const nextImage = () => {
    setCurrentImageSet((prev) => (prev + 1) % carouselImages.length);
  };

  const prevImage = () => {
    setCurrentImageSet((prev) => (prev - 1 + carouselImages.length) % carouselImages.length);
  };

  const handleGetStarted = () => {
    navigate('/app');
  };

  return (
    <div className="landing-page">
      {/* Header */}
      <header className="landing-header">
        <div className="landing-container">
          <div className="header-content">
            <div className="logo-section">
              <h1 className="logo">ARYA</h1>
              <span className="logo-badge">AI Travel</span>
            </div>
            <nav className="nav-menu">
              <button className="cta-button" onClick={handleGetStarted}>
                Start Planning
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* STUNNING CAROUSEL - The Star of the Show - Directly After Header */}
      <section className="main-carousel-section">
        <div className="carousel-mega-container">
          <h2 className="carousel-main-title">Where Will You Go Next?</h2>
          <p className="carousel-subtitle">Explore breathtaking destinations around the world</p>
          
          <div className="carousel-showcase">
            {/* Main Featured Image */}
            <div className="carousel-featured">
              <img 
                src={carouselImages[currentImageSet].url} 
                alt={carouselImages[currentImageSet].title}
                className="featured-image"
              />
              <div className="featured-overlay">
                <div className="featured-info">
                  <h3 className="featured-title">{carouselImages[currentImageSet].title}</h3>
                  <p className="featured-location">{carouselImages[currentImageSet].location}</p>
                </div>
              </div>
            </div>

            {/* Navigation Arrows */}
            <button className="carousel-nav prev" onClick={prevImage}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6"/>
              </svg>
            </button>
            <button className="carousel-nav next" onClick={nextImage}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </button>

            {/* Thumbnail Grid Below */}
            <div className="carousel-thumbnails">
              {carouselImages.map((img, index) => (
                <div 
                  key={index}
                  className={`thumbnail ${currentImageSet === index ? 'active' : ''}`}
                  onClick={() => setCurrentImageSet(index)}
                >
                  <img src={img.url} alt={img.title} />
                  <div className="thumbnail-overlay">
                    <span className="thumbnail-label">{img.location}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="carousel-cta">
            <button className="carousel-action-button" onClick={handleGetStarted}>
              Plan Your Dream Trip with AI
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="landing-container">
          <h2 className="section-title">Why Choose ARYA?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon"><IoSparkles className="icon-purple-glow-lg" /></div>
              <h3 className="feature-title">AI-Powered Planning</h3>
              <p className="feature-description">
                Our advanced AI understands your preferences and creates personalized
                itineraries tailored just for you.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon"><IoFlash className="icon-purple-glow-lg" /></div>
              <h3 className="feature-title">Lightning Fast</h3>
              <p className="feature-description">
                Get a complete travel plan in minutes, not hours. Save time and
                start your adventure sooner.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon"><IoGlobe className="icon-purple-glow-lg" /></div>
              <h3 className="feature-title">Global Coverage</h3>
              <p className="feature-description">
                Access recommendations for destinations worldwide, from popular
                cities to hidden gems.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon"><IoBulb className="icon-purple-glow-lg" /></div>
              <h3 className="feature-title">Smart Suggestions</h3>
              <p className="feature-description">
                Discover activities, restaurants, and attractions you'll love based
                on your unique interests.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon"><IoPhonePortrait className="icon-purple-glow-lg" /></div>
              <h3 className="feature-title">Easy to Use</h3>
              <p className="feature-description">
                Simple, intuitive interface that makes trip planning feel like
                chatting with a friend.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon"><IoWallet className="icon-purple-glow-lg" /></div>
              <h3 className="feature-title">Budget Friendly</h3>
              <p className="feature-description">
                Get the best value for your money with smart recommendations that
                fit your budget.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="how-it-works-section">
        <div className="landing-container">
          <h2 className="section-title">How It Works</h2>
          <div className="steps-container">
            <div className="step">
              <div className="step-number">1</div>
              <h3 className="step-title">Tell Us Your Dreams</h3>
              <p className="step-description">
                Share your destination, dates, and what you love to do. Be as
                specific or flexible as you like.
              </p>
            </div>
            <div className="step-arrow">→</div>
            <div className="step">
              <div className="step-number">2</div>
              <h3 className="step-title">AI Creates Your Plan</h3>
              <p className="step-description">
                Our AI analyzes millions of data points to craft the perfect
                itinerary just for you.
              </p>
            </div>
            <div className="step-arrow">→</div>
            <div className="step">
              <div className="step-number">3</div>
              <h3 className="step-title">Refine & Explore</h3>
              <p className="step-description">
                Chat with ARYA to adjust your plan, add activities, or explore
                alternatives in real-time.
              </p>
            </div>
            <div className="step-arrow">→</div>
            <div className="step">
              <div className="step-number">4</div>
              <h3 className="step-title">Start Your Adventure</h3>
              <p className="step-description">
                Export your itinerary and embark on an unforgettable journey with
                confidence.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section id="reviews" className="reviews-section">
        <div className="landing-container">
          <h2 className="section-title">What Travelers Say</h2>
          <div className="reviews-grid">
            {reviews.map((review, index) => (
              <div key={index} className="review-card">
                <div className="review-header">
                  <div className="review-avatar">
                  {review.avatar === 'business-woman' && <IoBriefcase className="icon-purple-glow" />}
                  {review.avatar === 'tech-person' && <IoPerson className="icon-purple-glow" />}
                  {review.avatar === 'traveler' && <IoAirplane className="icon-purple-glow" />}
                  {!['business-woman', 'tech-person', 'traveler'].includes(review.avatar) && <IoPerson className="icon-purple-glow" />}
                </div>
                  <div className="review-info">
                    <h4 className="review-name">{review.name}</h4>
                    <p className="review-location">{review.location}</p>
                  </div>
                </div>
                <div className="review-rating">
                  {[...Array(review.rating)].map((_, i) => (
                    <IoStar key={i} className="star icon-purple-glow" />
                  ))}
                </div>
                <p className="review-text">{review.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="landing-container">
          <div className="cta-content">
            <h2 className="cta-title">Ready to Plan Your Next Adventure?</h2>
            <p className="cta-subtitle">
              Join thousands of travelers who trust ARYA to plan their perfect trips.
            </p>
            <button className="primary-button large" onClick={handleGetStarted}>
              Start Planning Now
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-container">
          <div className="footer-content">
            <div className="footer-main">
              <h3 className="footer-title">ARYA</h3>
              <p className="footer-text">
                Your intelligent AI travel companion
              </p>
              <p className="footer-company">
                ONE CLICK TRAVEL SRL<br />
                CUI: 51874242
              </p>
            </div>
            <div className="footer-links">
              <button className="footer-link" onClick={() => navigate('/privacy-policy')}>Privacy Policy</button>
              <button className="footer-link" onClick={() => navigate('/terms-of-service')}>Terms of Service</button>
              <button className="footer-link" onClick={() => navigate('/cookie-policy')}>Cookie Policy</button>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2025 ONE CLICK TRAVEL SRL. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

