import React, { useState } from 'react';
import './AnimalCustomizer.css';

interface CustomizationSettings {
  bodyPrimary: string;
  bodySecondary: string;
  eyeColor: string;
  patternType: 'none' | 'stripes' | 'spots';
  patternColor: string;
}

interface AnimalCustomizerProps {
  animalType: string;
  onSave?: (settings: CustomizationSettings) => void;
}

const AnimalCustomizer: React.FC<AnimalCustomizerProps> = ({ animalType, onSave }) => {
  const [settings, setSettings] = useState<CustomizationSettings>({
    bodyPrimary: '#8B4513',
    bodySecondary: '#F4E4BC',
    eyeColor: '#2E86AB',
    patternType: 'none',
    patternColor: '#654321'
  });

  const updateSetting = (key: keyof CustomizationSettings, value: string) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
  };

  const handleSave = () => {
    if (onSave) {
      onSave(settings);
    }
  };

  const avatarStyle = {
    '--body-primary': settings.bodyPrimary,
    '--body-secondary': settings.bodySecondary,
    '--eye-color': settings.eyeColor,
    '--pattern-color': settings.patternColor,
  } as React.CSSProperties;

  return (
    <div className="animal-customizer">
      <div className="customizer-preview">
        <div 
          className={`animal-avatar ${animalType} pattern-${settings.patternType}`}
          style={avatarStyle}
        >
          {/* Placeholder SVG - will be replaced with your meerkat design */}
          <svg width="200" height="200" viewBox="0 0 200 200">
            {/* Body Primary Layer */}
            <g className="body-primary">
              <ellipse cx="100" cy="120" rx="60" ry="50" fill="var(--body-primary)" />
              <circle cx="100" cy="70" r="40" fill="var(--body-primary)" />
              <ellipse cx="75" cy="55" rx="8" ry="15" fill="var(--body-primary)" />
              <ellipse cx="125" cy="55" rx="8" ry="15" fill="var(--body-primary)" />
            </g>
            
            {/* Body Secondary Layer */}
            <g className="body-secondary">
              <ellipse cx="100" cy="130" rx="30" ry="25" fill="var(--body-secondary)" />
              <ellipse cx="100" cy="85" rx="20" ry="15" fill="var(--body-secondary)" />
            </g>
            
            {/* Patterns Layer */}
            <g className="patterns">
              <g className="pattern-stripes">
                <rect x="80" y="100" width="40" height="4" fill="var(--pattern-color)" />
                <rect x="80" y="110" width="40" height="4" fill="var(--pattern-color)" />
                <rect x="80" y="120" width="40" height="4" fill="var(--pattern-color)" />
              </g>
              <g className="pattern-spots">
                <circle cx="90" cy="105" r="5" fill="var(--pattern-color)" />
                <circle cx="110" cy="115" r="5" fill="var(--pattern-color)" />
                <circle cx="95" cy="125" r="4" fill="var(--pattern-color)" />
                <circle cx="115" cy="105" r="4" fill="var(--pattern-color)" />
              </g>
            </g>
            
            {/* Face Layer */}
            <g className="face">
              <circle cx="92" cy="65" r="4" fill="var(--eye-color)" />
              <circle cx="108" cy="65" r="4" fill="var(--eye-color)" />
              <ellipse cx="100" cy="75" rx="2" ry="3" fill="#000" />
              <path d="M 95 80 Q 100 85 105 80" stroke="#000" strokeWidth="2" fill="none" />
            </g>
          </svg>
        </div>
      </div>

      <div className="customizer-controls">
        <div className="control-section">
          <h3>Body Colors</h3>
          
          <div className="control-group">
            <label>Primary Color:</label>
            <input 
              type="color" 
              value={settings.bodyPrimary}
              onChange={(e) => updateSetting('bodyPrimary', e.target.value)}
            />
          </div>
          
          <div className="control-group">
            <label>Secondary Color:</label>
            <input 
              type="color" 
              value={settings.bodySecondary}
              onChange={(e) => updateSetting('bodySecondary', e.target.value)}
            />
          </div>
        </div>

        <div className="control-section">
          <h3>Face</h3>
          
          <div className="control-group">
            <label>Eye Color:</label>
            <input 
              type="color" 
              value={settings.eyeColor}
              onChange={(e) => updateSetting('eyeColor', e.target.value)}
            />
          </div>
        </div>

        <div className="control-section">
          <h3>Patterns</h3>
          
          <div className="control-group">
            <label>Pattern Type:</label>
            <select 
              value={settings.patternType}
              onChange={(e) => updateSetting('patternType', e.target.value as any)}
            >
              <option value="none">None</option>
              <option value="stripes">Stripes</option>
              <option value="spots">Spots</option>
            </select>
          </div>
          
          {settings.patternType !== 'none' && (
            <div className="control-group">
              <label>Pattern Color:</label>
              <input 
                type="color" 
                value={settings.patternColor}
                onChange={(e) => updateSetting('patternColor', e.target.value)}
              />
            </div>
          )}
        </div>

        <div className="control-section">
          <button className="save-button" onClick={handleSave}>
            Save Character
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnimalCustomizer;