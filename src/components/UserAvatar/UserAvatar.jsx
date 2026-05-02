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
    if (!url || typeof url !== 'string' || url.trim() === '') return false;
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
  if (frameSize) {
    frameCustomStyle.width = `${frameSize}%`;
    frameCustomStyle.height = `${frameSize}%`;
  }
  if (frameX !== 0 || frameY !== 0) {
    frameCustomStyle.transform = `translate(calc(-50% + ${frameX}px), calc(-50% + ${frameY}px))`;
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
