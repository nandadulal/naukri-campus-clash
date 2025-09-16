import React, { useEffect } from 'react';
import MainLayout from './MainLayout.jsx';
import Header from './Header.jsx';
import GamesGrid from './GamesGrid.jsx';
import UserProfile from './UserProfile.jsx';
import Leaderboard from './Leaderboard.jsx';
import CommunityFeed from './CommunityFeed.jsx';
import Icon from './Icon.jsx';
import PostsModal from './postsModal.jsx';
import mockData from '../mockData.js'; // Assuming mockData is in the same directory
import banner from '../assets/image.png';
const LandingPage = ({ userName }) => {
  const [activeSection, setActiveSection] = React.useState('games');
  const [posts, setPosts] = React.useState(mockData.posts || []);
  const [openModal, setOpenModal] = React.useState(false);
  const [getStats, setStats] = React.useState([]);
  const navOptions = [
    { label: 'Games', value: 'games' },
    { label: 'Community', value: 'community' }
  ];

  const handlePlayGame = (game) => {
    if (game.url)
      window.location.href = game.url;
    // alert(`Starting ${game.title}! This would launch the game in a real application.`);
  };

  const handleCreatePost = () => {
    setOpenModal(true)
    // alert('Create post modal would open here!');
  };

  const handleProfileClick = () => {
    alert('User profile would open here!');
  };

  const handleViewProfile = () => {
    alert('Full profile view would open here!');
  };

  useEffect(() => {
    // Fetch user stats from API or localStorage
    const fetchStats = async () => {
      try {
        const response = await fetch(
          "http://172.31.2.70:8100/api/games/user-profile/?user_name=" + userName
        );
        if (!response.ok) throw new Error("Failed to fetch user stats");
        const data = await response.json();

        // Assuming API response looks like { rank: 1, score: 1500, gamesPlayed: 10, totalXP: 2000, badges: ["Achiever", "Explorer"] }
        if (data) {
          setStats(data);
        }
      } catch (error) {
        console.error("Error fetching user stats:", error);
      }
    };
    if (userName) {
      fetchStats();
    }
  }, [userName]);
  return (
    <MainLayout>
      {userName &&
        <Header
          currentUser={userName}
          onProfileClick={handleProfileClick}
        />}

      <img className={'banner-image'} src={banner}></img>
      <div className="nav-toggle">
        {navOptions.map((option) => (
          <div
            key={option.value}
            className={`nav-toggle__item ${activeSection === option.value ? 'nav-toggle__item--active' : ''}`}
            onClick={() => setActiveSection(option.value)}
          >
            {option.label}
          </div>
        ))}
      </div>

      <div className="content">
        {activeSection === 'games' ? (
          <>
            <div className="user-profile-section">
              <UserProfile
                user={userName}
                getStats={getStats}
                onViewProfile={handleViewProfile}
              />
            </div>
            <div className="games-section">
              <div>
                <GamesGrid games={mockData.games} onPlayGame={handlePlayGame} />
              </div>
              <div>
                <Leaderboard users={userName} userCampus={getStats?.campus_name} currentUser={mockData.currentUser} />
              </div>
            </div>
            {/* <Leaderboard users={mockData.users} currentUser={mockData.currentUser} /> */}
          </>
        ) : (
          <>
            <CommunityFeed posts={posts} />
            {openModal && (
              <PostsModal
                xpValue={50}
                strengths={["Strategic Thinking", "Problem Solving"]}
                weakness={["Time Management", "Attention to Detail"]}
                onContinueGaming={(data) => {
                  setPosts([{ id: posts.length + 1, user: userName, content: data, likes: 0, comments: 0, timeAgo: "0m", anonymous: false }, ...posts]);
                  setOpenModal(false);
                }}
                onClose={() => {
                  setOpenModal(false)
                }} />)}
          </>
        )}
      </div>

      {activeSection === 'community' && (
        <button className="fab" onClick={handleCreatePost}>
          <Icon name="plus" size={24} />
        </button>
      )}
    </MainLayout>
  );
};

export default LandingPage;