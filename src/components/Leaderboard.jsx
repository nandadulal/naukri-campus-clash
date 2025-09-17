import React, { useEffect } from 'react';
import Toggle from './ToggleSwitch.jsx';
import LeaderboardItem from './LeaderboardItem.jsx';
import Button from './Button.jsx';
const Leaderboard = ({ users: userName, userCampus }) => {
  const [viewType, setViewType] = React.useState('users');
  const [ users, setUser ] = React.useState([]);
  useEffect(() => {
    // Fetch user stats from API or localStorage
    const fetchLeaderboardData = async (view) => {
      try {
        const response = await fetch(
          `https://central8.dev.sg1.chsh.in/gamification/api/api/games/${view === 'users' ? 'leaderboard' : 'leaderboard_campus'}/?user_name=${userName}`
        );
        if (!response.ok) throw new Error("Failed to fetch user stats");
        const data = await response.json();

        // Assuming API response looks like { rank: 1, score: 1500, gamesPlayed: 10, totalXP: 2000, badges: ["Achiever", "Explorer"] }
        if (data) {
          setUser(data);
        }
      } catch (error) {
        console.error("Error fetching user stats:", error);
      }
    };
    if (userName) {
      fetchLeaderboardData(viewType);
    }
  }, [userName, viewType]);
  const toggleOptions = [
    { label: 'User Rankings', value: 'users' },
    { label: 'Campus Rankings', value: 'campus' }
  ];

  const handleViewFullLeaderboard = () => {
    alert('Full leaderboard would open here!');
  };

  const handleToggle = () => {
    setViewType(viewType === 'users' ? 'campus' : 'users');
  }
  return (
    <div className="leaderboard">
      <div className="leaderboard__header">
        <h3 className="leaderboard__title">Leaderboard</h3>
        <Toggle
          active={viewType === 'campus'}
          options={toggleOptions}
          label={'Campus'}
          // activeOption={viewType}
          onToggle={handleToggle}
          className="leaderboard__toggle"
        />
      </div>

      <div className="leaderboard__list">
        {users && users.length && users.slice(0, 5).map((user) => (
          <LeaderboardItem
            key={user.id}
            user={user}
            isCampus={viewType === 'campus'}
            isCurrent={viewType === 'campus' ? userCampus === user["campus_name"]: user["user_name"] === userName }
          />
        ))}
      </div>

      <Button
        variant="outline"
        className="btn--full-width"
        onClick={handleViewFullLeaderboard}
        style={{ marginTop: 'var(--space-16)' }}
      >
        View Full Leaderboard
      </Button>
    </div>
  );
};

export default Leaderboard;