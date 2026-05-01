import React from 'react';
import './UserAvatar.css';

const UserAvatar = ({ 
  avatarUrl = '', 
  avatarFrame = null, 
  size = 'medium', 
  className = '', 
  onClick = undefined, 
  children = null, 
  style = {} 
}) => {
  const defaultAvatar = "/profile-pic-undefined.jpg";
  
  const isValidUrl = (url) => {
    if (!url || typeof url !== 'string' || url.trim() === '') return false;
    // Check if it starts with http, https, or /
    return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/') || url.startsWith('data:image');
  };

  const displayAvatar = isValidUrl(avatarUrl) ? avatarUrl : defaultAvatar;
  const displayFrame = isValidUrl(avatarFrame) ? avatarFrame : null;

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
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
      )}
    </div>
  );
};

export default UserAvatar;
