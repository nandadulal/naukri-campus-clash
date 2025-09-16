import React from "react";
import "./GameCompleteModal.css";

const GameCompleteModal = ({ xpValue, pathFinder, completedCareerNavigation, onContinueGaming, onClose }) => {
  return (
    <div className="gc-overlay">
      <div className="gc-modal">
        {/* Close Button */}
        <button className="gc-close" onClick={onClose}>✕</button>

        <h2 className="gc-title">Game Complete! 🎉</h2>
        <h3 className="gc-subtitle">Your Way</h3>
        <p className="gc-desc">Great job completing the challenge!</p>

        {/* XP Card */}
        <div className="gc-card gc-card-blue">
          <div className="gc-icon">⚡</div>
          <div>
            <p className="gc-value">+{xpValue} XP</p>
            <p className="gc-label">Experience Points Earned</p>
          </div>
        </div>

        {/* Path Finder Card */}
        <div className="gc-card gc-card-pink">
          <div className="gc-icon">🗺️</div>
          <div>
            <p className="gc-value">{pathFinder}</p>
            <p className="gc-label">{completedCareerNavigation}</p>
            <span className="gc-badge">Rare</span>
          </div>
        </div>

        {/* Buttons */}
        <button className="gc-btn-primary" onClick={onContinueGaming}>
          Continue Gaming
        </button>
      </div>
    </div>
  );
};

export default GameCompleteModal;
