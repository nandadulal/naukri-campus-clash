import React from 'react';
import Button from './Button.jsx';
import Logo from './Logo.jsx';
const GameCard = ({ game, onPlayClick }) => {
  const handlePlayClick = () => {
    onPlayClick(game);
  };

  return (
    <div className="game-card">
      <div className="game-card__header">
        <div>
          <h3 className="game-card__title">{game.title}</h3>
          <p className="game-card__company">Powered by {game.company}<Logo name={game.logo}/></p>
          {/* <p className="game-card__company">{game.company}</p> */}
        </div>
        <span className="game-card__duration">{game.duration}</span>
      </div>
      
      <p className="game-card__description">{game.description}</p>
      
      <div className="game-card__footer">
        <div>
        <span className="game-card__category">{game.played}</span>
        <span className="game-card__category">{game.rating}</span>
        <span className="game-card__category">{game.category}</span>
        </div>
        <Button size="sm" onClick={handlePlayClick}>
          Play Now
        </Button>
      </div>
    </div>
  );
};

export default GameCard;