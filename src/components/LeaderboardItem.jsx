import React from "react";
import Avatar from "./Avatar.jsx";
const LeaderboardItem = ({ user, isCurrent = false }) => {
  console.log('user',user.rank);
  return (
    <div className={`leaderboard-item ${isCurrent ? 'leaderboard-item--current' : ''}`}>
      <span className="leaderboard-item__rank">#{user.rank ? user.rank : user.ranking}</span>
      <Avatar name={user.user_name} size="sm" className="leaderboard-item__avatar" />
      <div className="leaderboard-item__info">
        <div className="leaderboard-item__name">{user.user_name ? user.user_name : user.campus_name}</div>
      </div>
      <span className="leaderboard-item__score">{user.total_xp}</span>
    </div>
  );
};

export default LeaderboardItem;