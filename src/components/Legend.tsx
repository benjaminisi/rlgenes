import React from 'react';
import './Legend.css';

interface LegendProps {
  isVisible: boolean;
  onToggle: () => void;
}

const Legend: React.FC<LegendProps> = ({ isVisible, onToggle }) => {
  if (!isVisible) {
    return (
      <button className="legend-toggle collapsed" onClick={onToggle} title="Show Legend">
        ℹ️ Legend
      </button>
    );
  }

  return (
    <div className="legend-container">
      <div className="legend-header">
        <h4>📖 SNP Annotation Legend</h4>
        <button className="legend-close" onClick={onToggle} title="Hide Legend">
          ✕
        </button>
      </div>
      <div className="legend-content">
        <div className="legend-item">
          <span className="legend-icon homozygous">☁️</span>
          <div className="legend-text">
            <strong>Homozygous (Red)</strong>
            <p>Both alleles are the problem variant</p>
          </div>
        </div>
        <div className="legend-item">
          <span className="legend-icon heterozygous">☁</span>
          <div className="legend-text">
            <strong>Heterozygous (Yellow)</strong>
            <p>One allele is the problem variant</p>
          </div>
        </div>
        <div className="legend-item">
          <span className="legend-icon wild">⚪</span>
          <div className="legend-text">
            <strong>Wild Type (Black)</strong>
            <p>Neither allele is the problem variant</p>
          </div>
        </div>
        <div className="legend-item">
          <span className="legend-icon missing">❓</span>
          <div className="legend-text">
            <strong>Data Missing (Grey)</strong>
            <p>No genetic data available for this SNP</p>
          </div>
        </div>
      </div>
      <div className="legend-footer">
        <small>💡 Tip: Click on section names in Grand Summary to jump to that section</small>
      </div>
    </div>
  );
};

export { Legend };

