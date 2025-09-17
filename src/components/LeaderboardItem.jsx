import React from "react";
import Avatar from "./Avatar.jsx";
const LeaderboardItem = ({ user, isCurrent = false, isCampus }) => {
  console.log('user',user.rank);
  return (
    <div className={`leaderboard-item ${isCurrent ? 'leaderboard-item--current' : ''}`}>
      <span className="leaderboard-item__rank">#{!isCampus ? user.rank : user.ranking}</span>
      <Avatar name={!isCampus ? user.user_name : user.campus_name} size="sm" className="leaderboard-item__avatar" />
      <div className="leaderboard-item__info">
        <div className="leaderboard-item__name">{!isCampus ? user.user_name : user.campus_name}</div>
        {!isCampus ? <div className="leaderboard-item__campus">{user.campus_name}</div>: null}
      </div>
      <span className="leaderboard-item__score">{user.total_xp}</span>
    </div>
  );
};

export default LeaderboardItem;