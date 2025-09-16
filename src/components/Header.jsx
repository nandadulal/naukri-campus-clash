import React from 'react';
import Avatar from './Avatar.jsx';
import Icon from './Icon.jsx';
import logo from '../assets/logo.png';
// import './Header.css'; // Assuming you have a CSS file for styling
const Header = ({ currentUser, onProfileClick }) => {
  return (
    <header className="header">
      <div className="header__brand">
        <h1 className="header__logo"><img className="header__img" src={logo}/></h1>
      </div>
      <div className="header__nav">
        <a href="/" className="header__nav-link">Prepare</a>
        <a href="/leaderboard" className="header__nav-link">Participate</a>
        <a href="/profile" className="header__nav-link">Opportunities</a>
        <div className="header__community">
          <button className="header__nav-link header__nav-cta">Community</button>
        </div>
      </div>
      <div className="header__user-section">
        {/* <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-8)' }}>
          <Icon name="fire" size={16} />
          <span>{currentUser.streak} day streak</span>
        </div> */}
        <Avatar 
          name={currentUser} 
          size="md"
          onClick={onProfileClick}
        />
      </div>
    </header>
  );
};

export default Header;