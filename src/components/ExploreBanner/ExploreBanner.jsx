import React from 'react';
import { GroupRounded } from '@mui/icons-material';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import UserAvatar from '../UserAvatar/UserAvatar';
import './ExploreBanner.css';


const ExploreBanner = ({
  bannerUrl,
  themeColor = '#fff',
  avatarUrl,
  avatarFrame,
  ownerDisplayName,
  hubName,
  memberCount,
  highlightImgUrls = [],
  onVisit,
  loading = false
}) => {
  return (
    <div
      className="explore-banner-component"
      style={{
        backgroundColor: '#555',
        backgroundImage: bannerUrl ? `url(${bannerUrl})` : 'none',
        color: themeColor,
        border: `3px solid ${themeColor}`
      }}
    >
      <div className="explore-banner-left">
        <div className="hub-info">
          <div className="hub-owner-info">
            <UserAvatar
              className="hub-owner-pfp"
              avatarUrl={avatarUrl}
              size="medium"
            />
            <div className="hub-owner-info-display">
              <div className="hub-owner-display-name">
                <span>Owned by:</span>
                <span>{ownerDisplayName || "Unknown"}</span>
              </div>
            </div>
          </div>
          <h2 style={{ color: themeColor }}>{hubName?.toUpperCase() || "NO HUB"}</h2>
        </div>

        <button
          className="explore-visit-btn"
          onClick={onVisit}
        >
          <div className="hub-info-member-count">
            <span><p>{memberCount ?? "N/A"}</p></span> <GroupRounded />
          </div>
          Visit Fanhub <span className="ico">→</span>
        </button>
      </div>

      <div className="explore-banner-right">
        {!loading ? (
          [0, 1, 2, 3].map((i) => (
            <img
              key={i}
              src={highlightImgUrls[i] || "/picture-not-available-photo.jpg"}
              alt=""
              onError={(e) => {
                e.target.src = "/picture-not-available-photo.jpg";
              }}
            />
          ))
        ) : (
          [0, 1, 2, 3].map((i) => (
            <SkeletonTheme key={i} baseColor="#d7d7d7" highlightColor="#ffffff">
              <Skeleton />
            </SkeletonTheme>
          ))
        )}
      </div>
    </div>
  );
};

export default ExploreBanner;
