import React from 'react';
import Toggle from './Toggle.jsx';
import ToggleSwitch from './ToggleSwitch.jsx';
import PostCard from './PostCard.jsx';

const CommunityFeed = ({ posts }) => {
  const [feedType, setFeedType] = React.useState('trending');
  const [campusOnly, setCampusOnly] = React.useState(false);
  
  const feedOptions = [
    { label: 'Trending', value: 'trending' },
    { label: 'Latest', value: 'latest' }
  ];
  
  return (
    <div className="community-section">
      <div className="community-header">
        <Toggle 
          options={feedOptions}
          activeOption={feedType}
          onToggle={setFeedType}
        />
        <ToggleSwitch 
          active={campusOnly}
          onToggle={() => setCampusOnly(!campusOnly)}
          label="Campus Only"
        />
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-16)' }}>
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
};

export default CommunityFeed;