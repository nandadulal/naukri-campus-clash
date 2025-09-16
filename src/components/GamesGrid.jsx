import React from 'react';
import GameCard from './GameCard.jsx';

const GamesGrid = ({ games, onPlayGame }) => {
  return (
    <div className="games-grid">
      {games.map((game) => (
        <GameCard 
          key={game.id} 
          game={game} 
          onPlayClick={onPlayGame}
        />
      ))}
    </div>
  );
};

export default GamesGrid;