import { useState, useEffect } from 'react';
import Layout from '../components/Layout'
import './Config.css';

function Config() {
  const [primaryColor, setPrimaryColor] = useState('#69f2c4');

  const colors = [
    { name: 'Padrão', value: '#69f2c4' },
    { name: 'Vermelho', value: '#CF0E0E' },
    { name: 'Azul', value: '#00A8FF' },
    { name: 'Verde', value: '#008000' },
    { name: 'Amarelo', value: '#FFFF00' },
    { name: 'Roxo', value: '#9D00FF' },
    { name: 'Rosa', value: '#E840AA' },
  ];

  useEffect(() => {
    const savedColor = localStorage.getItem('primaryColor');
    if (savedColor) {
      setPrimaryColor(savedColor);
      document.documentElement.style.setProperty('--primary', savedColor);
    }
  }, []);

  const handleColorChange = (newColor) => {
    setPrimaryColor(newColor);
    document.documentElement.style.setProperty('--primary', newColor);
    localStorage.setItem('primaryColor', newColor);
    // Escurece a cor em 20% para --primary-dark
    const darkColor = adjustBrightness(newColor, -20)
    document.documentElement.style.setProperty('--primary-dark', darkColor)
  };

  function adjustBrightness(color, percent) {
  const num = parseInt(color.replace('#',''), 16)
  const amt = Math.round(2.55 * percent)
  const R = Math.max(0, Math.min(255, (num >> 16) + amt))
  const G = Math.max(0, Math.min(255, (num >> 8 & 0x00FF) + amt))
  const B = Math.max(0, Math.min(255, (num & 0x0000FF) + amt))
  return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)
}
  return (
  <Layout>
    <div className="config-container">
      <h1>Configurações</h1>
      
      <div className="config-section">
        <h2>Troca de Cor</h2>
        <p>Escolha uma cor para personalizar o site:</p>
        
        <div className="color-grid">
          {colors.map((color) => (
            <button
              key={color.value}
              className={`color-button ${primaryColor === color.value ? 'active' : ''}`}
              style={{ backgroundColor: color.value }}
              onClick={() => handleColorChange(color.value)}
              title={color.name}
              aria-label={`Selecionar cor ${color.name}`}
            >
              <span className="color-label">{color.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
    </Layout>
  );
}

export default Config;
