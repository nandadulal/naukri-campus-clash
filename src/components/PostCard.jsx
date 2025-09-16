import React from 'react';
import Avatar from './Avatar.jsx';
import Icon from './Icon.jsx';
const PostCard = ({ post }) => {
  return (
    <div className="post-card">
      <div className="post-card__header">
        <Avatar name={post.anonymous ? 'Anonymous' : post.user} size="md" />
        <div className="post-card__user-info">
          <h4>{post.anonymous ? 'Anonymous' : post.user}</h4>
          <p>{post.anonymous ? 'Campus Hidden' : post.campus}</p>
        </div>
        <span className="post-card__time">{post.timeAgo}</span>
      </div>
      
      <div className="post-card__content">
        {post.content}
      </div>
      
      <div className="post-card__actions">
        <div className="post-action">
          <Icon name="heart" size={16} />
          <span>{post.likes}</span>
        </div>
        <div className="post-action">
          <Icon name="comment" size={16} />
          <span>{post.comments.length}</span>
        </div>
        <div className="post-action">
          <Icon name="share" size={16} />
          <span>Share</span>
        </div>
      </div>
    </div>
  );
};

export default PostCard;