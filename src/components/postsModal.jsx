import React from "react";
import "./posts.css";

const postsModal = ({ xpValue, strengths, weakness, onContinueGaming, onClose }) => {
    const [postContent, setPostContent] = React.useState("");
    return (
        <div className="gc-overlay">
            <div className="gc-modal">
                {/* Close Button */}
                <button className="gc-close" onClick={onClose}>✕</button>

                <h2 className="gc-title">Post Here 🎉</h2>
                <p className="gc-desc">Express your ideas with the community.</p>

                {/* XP Card */}
                <div className="gc-card gc-card-blue">
                    <textarea className="naukri-textarea" onChange={(e) => setPostContent(e.target.value)} placeholder="What's on your mind?"></textarea>
                    {/* <div className="gc-icon">⚡</div>
                    <div>
                        <p className="gc-value">+{xpValue} XP</p>
                        <p className="gc-label">Experience Points Earned</p>
                    </div> */}
                </div>
                {/* Buttons */}
                <button className="gc-btn-primary" onClick={() => {onContinueGaming(postContent)}}>
                    Post
                </button>
            </div>
        </div>
    );
};

export default postsModal;
