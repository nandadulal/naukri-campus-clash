const Icon = ({ name, size = 16 }) => {
  const icons = {
    heart: '♥',
    comment: '💬',
    share: '📤',
    plus: '+',
    fire: '🔥',
    trophy: '🏆',
    star: '⭐',
    games: '🎮',
    users: '👥'
  };
  
  return (
    <span className="icon" style={{ fontSize: `10px` }}>
      {icons[name] || name}
    </span>
  );
};

export default Icon;