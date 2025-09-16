import React from 'react';

const ToggleSwitch = ({ active, onToggle, label }) => {
  return (
    <div className="campus-only-toggle" onClick={onToggle}>
      <span>{label}</span>
      <div className={`toggle-switch ${active ? 'toggle-switch--active' : ''}`}>
        <div className="toggle-switch__handle"></div>
      </div>
    </div>
  );
};

export default ToggleSwitch;