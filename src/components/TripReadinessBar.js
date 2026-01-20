import React from 'react';
import { IoAirplane, IoSparkles } from 'react-icons/io5';
import './TripReadinessBar.css';

const SLOT_LABELS = {
  destination: { en: 'Destination', ro: 'Destinatie' },
  origin: { en: 'From', ro: 'De unde' },
  travelers: { en: 'Travelers', ro: 'Calatori' },
  dates: { en: 'Dates', ro: 'Date' },
  duration: { en: 'Duration', ro: 'Durata' },
  purpose: { en: 'Purpose', ro: 'Scop' }
};

const TripReadinessBar = ({
  completionPercentage = 0,
  filledFields = [],
  onClick,
  language = 'en',
  isExtracting = false
}) => {
  const allSlots = ['destination', 'origin', 'travelers', 'dates', 'duration', 'purpose'];

  const getSlotLabel = (slot) => {
    return SLOT_LABELS[slot]?.[language] || SLOT_LABELS[slot]?.en || slot;
  };

  const getStatusText = () => {
    if (completionPercentage === 100) {
      return language === 'ro' ? 'Gata pentru creare!' : 'Ready to create!';
    }
    const missingCount = allSlots.length - filledFields.length;
    if (language === 'ro') {
      return `${missingCount} ${missingCount === 1 ? 'camp ramas' : 'campuri ramase'}`;
    }
    return `${missingCount} ${missingCount === 1 ? 'field' : 'fields'} remaining`;
  };

  return (
    <div
      className={`trip-readiness-bar ${completionPercentage === 100 ? 'complete' : ''} ${isExtracting ? 'extracting' : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => e.key === 'Enter' && onClick?.()}
    >
      <div className="trip-readiness-content">
        <div className="trip-readiness-info">
          <div className="trip-readiness-icon">
            {completionPercentage === 100 ? <IoSparkles className="icon-purple-glow" /> : <IoAirplane className="icon-purple-glow" />}
          </div>
          <div className="trip-readiness-text">
            <span className="trip-readiness-title">
              {language === 'ro' ? 'Planificare Calatorie' : 'Trip Planning'}
            </span>
            <span className="trip-readiness-status">
              {getStatusText()}
            </span>
          </div>
        </div>

        <div className="trip-readiness-progress-section">
          <div className="trip-readiness-percentage">{completionPercentage}%</div>
          <div className="trip-readiness-progress-bar">
            <div
              className="trip-readiness-progress-fill"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>

        <div className="trip-readiness-slots">
          {allSlots.map((slot) => (
            <div
              key={slot}
              className={`trip-readiness-slot ${filledFields.includes(slot) ? 'filled' : 'empty'}`}
              title={getSlotLabel(slot)}
            >
              <span className="slot-icon">
                {filledFields.includes(slot) ? '✓' : '○'}
              </span>
              <span className="slot-label">{getSlotLabel(slot)}</span>
            </div>
          ))}
        </div>

        <div className="trip-readiness-action">
          <span className="action-text">
            {completionPercentage === 100
              ? (language === 'ro' ? 'Click pentru a crea' : 'Click to create')
              : (language === 'ro' ? 'Click pentru detalii' : 'Click for details')}
          </span>
          <svg className="action-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default TripReadinessBar;
