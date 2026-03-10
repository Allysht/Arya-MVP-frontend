import React, { useState, useEffect } from 'react';
import { IoLocationSharp, IoHome, IoPeople, IoCalendar, IoTimer, IoFlag, IoSparkles, IoBulb, IoWallet } from 'react-icons/io5';
import './TripFormPopup.css';

const FIELD_CONFIG = {
  destination: {
    label: { en: 'Destination', ro: 'Destinatie' },
    placeholder: { en: 'Where do you want to go?', ro: 'Unde vrei sa mergi?' },
    icon: IoLocationSharp,
    type: 'text'
  },
  origin: {
    label: { en: 'Departing From', ro: 'Plecare din' },
    placeholder: { en: 'Where are you traveling from?', ro: 'De unde pleci?' },
    icon: IoHome,
    type: 'text'
  },
  travelers: {
    label: { en: 'Travelers', ro: 'Calatori' },
    placeholder: { en: 'How many people?', ro: 'Cate persoane?' },
    icon: IoPeople,
    type: 'text'
  },
  dates: {
    label: { en: 'Travel Dates', ro: 'Date de calatorie' },
    placeholder: { en: 'When do you want to travel?', ro: 'Cand vrei sa calatoresti?' },
    icon: IoCalendar,
    type: 'text'
  },
  duration: {
    label: { en: 'Duration', ro: 'Durata' },
    placeholder: { en: 'How long is your trip?', ro: 'Cat dureaza calatoria?' },
    icon: IoTimer,
    type: 'text'
  },
  purpose: {
    label: { en: 'Purpose', ro: 'Scop' },
    placeholder: { en: 'What type of trip?', ro: 'Ce tip de calatorie?' },
    icon: IoFlag,
    type: 'select',
    options: [
      { value: 'relaxation', label: { en: 'Relaxation', ro: 'Relaxare' } },
      { value: 'adventure', label: { en: 'Adventure', ro: 'Aventura' } },
      { value: 'sightseeing', label: { en: 'Sightseeing', ro: 'Vizitare' } },
      { value: 'romantic', label: { en: 'Romantic', ro: 'Romantic' } },
      { value: 'food & wine', label: { en: 'Food & Wine', ro: 'Gastronomie' } },
      { value: 'business', label: { en: 'Business', ro: 'Afaceri' } },
      { value: 'family', label: { en: 'Family', ro: 'Familie' } },
      { value: 'friends', label: { en: 'Friends', ro: 'Prieteni' } },
      { value: 'solo', label: { en: 'Solo', ro: 'Singur' } },
      { value: 'shopping', label: { en: 'Shopping', ro: 'Cumparaturi' } }
    ]
  },
  budget: {
    label: { en: 'Budget', ro: 'Buget' },
    placeholder: { en: 'e.g. 3000 euros, $500/person, luxury', ro: 'ex: 3000 euro, buget redus, lux' },
    icon: IoWallet,
    type: 'text'
  }
};

const TripFormPopup = ({
  isOpen,
  onClose,
  tripData = {},
  onSave,
  onCreateTrip,
  language = 'en',
  isComplete = false
}) => {
  const [formData, setFormData] = useState({
    destination: '',
    origin: '',
    travelers: '',
    dates: '',
    duration: '',
    purpose: '',
    budget: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Sync form data when tripData changes
  useEffect(() => {
    if (tripData) {
      setFormData({
        destination: tripData.destination || '',
        origin: tripData.origin || '',
        travelers: tripData.travelers || '',
        dates: tripData.dates || '',
        duration: tripData.duration || '',
        purpose: tripData.purpose || '',
        budget: tripData.budget || ''
      });
    }
  }, [tripData]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave?.(formData);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateTrip = async () => {
    setIsCreating(true);
    try {
      // First save the data
      await onSave?.(formData);
      // Then trigger trip creation
      await onCreateTrip?.(formData);
      onClose();
    } finally {
      setIsCreating(false);
    }
  };

  const getFieldLabel = (field) => {
    return FIELD_CONFIG[field]?.label?.[language] || FIELD_CONFIG[field]?.label?.en || field;
  };

  const getFieldPlaceholder = (field) => {
    return FIELD_CONFIG[field]?.placeholder?.[language] || FIELD_CONFIG[field]?.placeholder?.en || '';
  };

  const getOptionLabel = (option) => {
    return option.label?.[language] || option.label?.en || option.value;
  };

  const isFieldFilled = (field) => {
    return formData[field] && formData[field].toString().trim() !== '';
  };

  const requiredFields = ['destination', 'origin', 'travelers', 'dates', 'duration', 'purpose', 'budget'];
  const filledCount = requiredFields.filter(f => isFieldFilled(f)).length;
  const completionPercentage = Math.round((filledCount / requiredFields.length) * 100);
  const canCreate = completionPercentage === 100;

  if (!isOpen) return null;

  return (
    <div className="trip-form-overlay" onClick={onClose}>
      <div className="trip-form-popup" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="trip-form-header">
          <div className="trip-form-header-content">
            <h2 className="trip-form-title">
              {language === 'ro' ? 'Detalii Calatorie' : 'Trip Details'}
            </h2>
            <div className="trip-form-progress">
              <div className="progress-circle">
                <svg viewBox="0 0 36 36">
                  <path
                    className="progress-circle-bg"
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="progress-circle-fill"
                    strokeDasharray={`${completionPercentage}, 100`}
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <span className="progress-text">{completionPercentage}%</span>
              </div>
              <span className="progress-label">
                {filledCount}/{requiredFields.length} {language === 'ro' ? 'complete' : 'complete'}
              </span>
            </div>
          </div>
          <button className="trip-form-close" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form Body */}
        <div className="trip-form-body">
          <div className="trip-form-fields">
            {Object.keys(FIELD_CONFIG).map((field) => {
              const config = FIELD_CONFIG[field];
              const isFilled = isFieldFilled(field);

              return (
                <div
                  key={field}
                  className={`trip-form-field ${isFilled ? 'filled' : 'empty'}`}
                >
                  <label className="field-label">
                    <span className="field-icon"><config.icon className="icon-purple-glow" /></span>
                    <span className="field-name">{getFieldLabel(field)}</span>
                    {isFilled && <span className="field-check">✓</span>}
                  </label>

                  {config.type === 'select' ? (
                    <select
                      className="field-input field-select"
                      value={formData[field] || ''}
                      onChange={(e) => handleInputChange(field, e.target.value)}
                    >
                      <option value="">{getFieldPlaceholder(field)}</option>
                      {config.options.map((option) => (
                        <option key={option.value} value={option.value}>
                          {getOptionLabel(option)}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      className="field-input"
                      placeholder={getFieldPlaceholder(field)}
                      value={formData[field] || ''}
                      onChange={(e) => handleInputChange(field, e.target.value)}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Tips Section */}
          <div className="trip-form-tips">
            <div className="tip-icon"><IoBulb className="icon-purple-glow" /></div>
            <p className="tip-text">
              {language === 'ro'
                ? 'Continua sa vorbesti cu Arya pentru a completa automat detaliile sau editeaza manual aici.'
                : 'Keep chatting with Arya to auto-fill details or manually edit them here.'}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="trip-form-footer">
          <button
            className="trip-form-btn secondary"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving
              ? (language === 'ro' ? 'Se salveaza...' : 'Saving...')
              : (language === 'ro' ? 'Salveaza' : 'Save Changes')}
          </button>
          <button
            className={`trip-form-btn primary ${!canCreate ? 'disabled' : ''}`}
            onClick={handleCreateTrip}
            disabled={!canCreate || isCreating}
          >
            {isCreating
              ? (language === 'ro' ? 'Se creeaza...' : 'Creating...')
              : canCreate
                ? (language === 'ro' ? <><IoSparkles className="icon-purple-glow" style={{ marginRight: '6px' }} /> Creeaza Calatoria</> : <><IoSparkles className="icon-purple-glow" style={{ marginRight: '6px' }} /> Create Trip</>)
                : (language === 'ro' ? `Completeaza inca ${requiredFields.length - filledCount} campuri` : `Fill ${requiredFields.length - filledCount} more fields`)}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TripFormPopup;
