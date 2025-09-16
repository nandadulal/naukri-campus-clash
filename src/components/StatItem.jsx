import React from "react";

const StatItem = ({index, value, label }) => {
  const stats = [
    { gradient: "linear-gradient(135deg, #FF512F, #F09819)", icon: "🔥" },
    { gradient: "linear-gradient(135deg, #F7971E, #FFD200)", icon: "⚡" },
    { gradient: "linear-gradient(135deg, #00b09b, #96c93d)", icon: "🎯" },
    { gradient: "linear-gradient(135deg, #667eea, #764ba2)", icon: "🏆" }
  ];
  return (
    <div
          key={index}
          // className="stat-card"
          className={`flex stat-card items-center gap-4 px-6 py-4 rounded-full shadow-lg text-white bg-gradient-to-r`}
          style={{ background: stats[index%4].gradient, borderRadius: '12px', color: 'white', padding: '20px', minWidth: '120px' }}
        >
          <div className="icon">{stats[index%4].icon}</div>
          <div className="stat-content">
            <span className="stat-content__label text-xl font-bold">{label}</span>
            <span className="stat-content__value text-xl font-bold">{value}</span>
          </div>
        </div>
    // <div className="stat-item">
    //   <span className="stat-item__value">{value}</span>
    //   <span className="stat-item__label">{label}</span>
    // </div>
  );
};

export default StatItem;