import React from 'react';
const Badge = ({ children, className = '' }) => {
  return (
    <span className={`badge ${className}`}>
      {children}
    </span>
  );
};

export default Badge;