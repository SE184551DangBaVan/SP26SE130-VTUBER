import React from 'react';
import './UserAvatar.css';

const UserAvatar = ({ 
  avatarUrl = '', 
  avatarFrame = null, 
  size = 'medium', 
  className = '', 
  onClick = undefined, 
  children = null, 
  style = {},
  frameSize = null,
  frameX = 0,
  frameY = 0
}) => {
  const defaultAvatar = "/profile-pic-undefined.jpg";
  
  const isValidUrl = (url) => {
    if (!url || typeof url !== 'string' || url.trim() === '' || url === 'null') return false;
    // Check if it starts with http, https, /, data:image, or blob:
    return (
      url.startsWith('http://') || 
      url.startsWith('https://') || 
      url.startsWith('/') || 
      url.startsWith('data:image') ||
      url.startsWith('blob:')
    );
  };

  const displayAvatar = isValidUrl(avatarUrl) ? avatarUrl : defaultAvatar;
  const displayFrame = isValidUrl(avatarFrame) ? avatarFrame : null;

  // Custom frame styles if props are provided
  const frameCustomStyle = {};
  
  // Normalize inputs to numbers, fallback to defaults
  const fs = Number(frameSize) || 115;
  const fx = Number(frameX) || 0;
  const fy = Number(frameY) || 0;

  // Set size
  frameCustomStyle.width = `${fs}%`;
  frameCustomStyle.height = `${fs}%`;
  
  // Set position (using percentages for responsiveness)
  // We use left/top instead of transform to allow the CSS transform: translate(-50%, -50%) to work
  if (fx !== 0 || fy !== 0) {
    frameCustomStyle.left = `calc(50% + ${fx}%)`;
    frameCustomStyle.top = `calc(50% + ${fy}%)`;
  }

  return (
    <div className={`user-avatar-container ${size} ${className}`} onClick={onClick} style={{ ...(onClick ? { cursor: 'pointer' } : {}), ...style }}>
      <div className="avatar-image-wrapper">
        <img 
          src={displayAvatar} 
          alt="User Avatar" 
          className="user-avatar-image" 
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = defaultAvatar;
          }}
        />
        {children}
      </div>
      {displayFrame && (
        <img 
          src={displayFrame} 
          alt="Avatar Frame" 
          className="user-avatar-frame" 
          style={frameCustomStyle}
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
      )}
    </div>
  );
};

export default UserAvatar;
