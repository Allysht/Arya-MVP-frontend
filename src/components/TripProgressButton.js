import React from 'react';
import { IoAirplane } from 'react-icons/io5';
import './TripProgressButton.css';

const TripProgressButton = ({
  filledCount = 0,
  totalCount = 6,
  onClick,
  isExtracting = false
}) => {
  return (
    <button
      className={`trip-progress-button ${isExtracting ? 'extracting' : ''}`}
      onClick={onClick}
      type="button"
      title={`Trip Progress: ${filledCount}/${totalCount} fields filled`}
    >
      <div className="trip-progress-button-inner">
        <IoAirplane className="trip-progress-icon" />
        <span className="trip-progress-count">{filledCount}/{totalCount}</span>
      </div>
    </button>
  );
};

export default TripProgressButton;
