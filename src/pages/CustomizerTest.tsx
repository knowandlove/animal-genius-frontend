import React from 'react';
import AnimalCustomizer from '../components/AnimalCustomizer';

const CustomizerTest: React.FC = () => {
  const handleSave = (settings: any) => {
    console.log('Character settings saved:', settings);
    // Here you would typically save to database
    alert('Character saved! Check console for settings.');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1 style={{ color: '#333', marginBottom: '0.5rem' }}>
          Animal Character Customizer
        </h1>
        <p style={{ color: '#666', marginBottom: '2rem' }}>
          Test page for customizing your meerkat avatar
        </p>
      </div>
      
      <AnimalCustomizer 
        animalType="meerkat" 
        onSave={handleSave}
      />
      
      <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
        <p>
          This is a test page. Your custom meerkat SVG will replace the placeholder when ready!
        </p>
      </div>
    </div>
  );
};

export default CustomizerTest;