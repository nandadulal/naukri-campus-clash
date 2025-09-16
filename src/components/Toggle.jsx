import React from "react";

const Toggle = ({ options, activeOption, onToggle, className = '' }) => {
  return (
    <div className={`filter-toggle ${className}`}>
      {options.map((option) => (
        <div
          key={option.value}
          className={`filter-toggle__item ${activeOption === option.value ? 'filter-toggle__item--active' : ''}`}
          onClick={() => onToggle(option.value)}
        >
          {option.label}
        </div>
      ))}
    </div>
  );
};

export default Toggle;