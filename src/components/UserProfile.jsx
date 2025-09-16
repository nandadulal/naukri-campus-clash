import React, { useEffect } from 'react';
import Avatar from './Avatar.jsx';
import StatItem from './StatItem.jsx';
import Badge from './Badge.jsx';
import Button from './Button.jsx';
const UserProfile = ({ user, onViewProfile, getStats }) => {
  // const [ getStats, setStats ] = React.useState([]);

  // useEffect(() => {
  //   // Fetch user stats from API or localStorage
  //   const fetchStats = async () => {
  //     try {
  //       const response = await fetch(
  //         "https://central8.dev.sg1.chsh.in/gamification/api/api/games/user-profile/?user_name=" + user
  //       );
  //       if (!response.ok) throw new Error("Failed to fetch user stats");
  //       const data = await response.json();

  //       // Assuming API response looks like { rank: 1, score: 1500, gamesPlayed: 10, totalXP: 2000, badges: ["Achiever", "Explorer"] }
  //       if (data) {
  //         setStats(data);
  //       }
  //     } catch (error) {
  //       console.error("Error fetching user stats:", error);
  //     }
  //   };
  //   if(user) {
  //     fetchStats();
  //   }
  // }, [user]);
  return (
    <div className="user-profile">
      <div className="user-profile__header">
        {/* <Avatar name={user.name} size="lg" /> */}
        <div className="user-profile__info">
          <h3>{getStats.user_name}</h3>
          <p>{getStats.campus}</p>
        </div>
      </div>
      
      <div className="user-profile__stats">
        <StatItem index={0} value={getStats.streak} label="Current Streak" />
        <StatItem index={1} value={getStats.total_xp} label="Total XP" />
        <StatItem index={2} value={getStats.game_count} label="Games Completed" />
        <StatItem index={3} value={getStats.ranking} label="Your Ranking" />
      </div>
      
      {/* <div className="user-profile__badges">
        <h4>Achievements</h4>
        <div className="badges-list">
          {user.badges.map((badge, index) => (
            <Badge key={index}>{badge}</Badge>
          ))}
        </div>
      </div> */}
      
      {/* <Button 
        variant="outline" 
        className="btn--full-width"
        onClick={onViewProfile}
      >
        View Full Profile
      </Button> */}
    </div>
  );
};

export default UserProfile;