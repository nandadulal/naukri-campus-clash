import React from 'react';
const Avatar = ({ name, size = 'md', className = '', onClick }) => {
  const initials = name ? name.split(' ').map(n => n[0]).join('') : '';
  const sizeMap = {
    sm: '32px',
    md: '40px',
    lg: '48px'
  };
  
  return (
    <div 
      className={`user-profile__avatar ${className}`}
      style={{ 
        width: sizeMap[size], 
        height: sizeMap[size],
        cursor: onClick ? 'pointer' : 'default'
      }}
      onClick={onClick}
    >
      {initials}
    </div>
  );
};

export default Avatar;