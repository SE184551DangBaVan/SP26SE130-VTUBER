"use client";

import React, { useEffect, useState } from "react";
import { getUserDailyMissionStatus } from "@/services/UserController";
import "./DailyMissionDropdown.css";

const DailyMissionDropdown = () => {
  const [missionData, setMissionData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const data = await getUserDailyMissionStatus();
        if (data) {
          setMissionData(data);
        }
      } catch (error) {
        console.error("Error fetching daily mission status:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, []);

  if (loading) return <div className="daily-mission-loading">Loading missions...</div>;
  if (!missionData) return null;

  const { likeAmount, bonus10, bonus20 } = missionData;
  
  // Calculate progress for the donut
  // Max likes for the mission is 20
  const maxLikes = 20;
  const currentLikes = Math.min(likeAmount, maxLikes);
  const percentage = (currentLikes / maxLikes) * 100;
  const strokeDasharray = `${percentage} ${100 - percentage}`;

  return (
    <div className="daily-mission-dropdown">
      <div className="daily-mission-header">
        <h3>Daily Missions</h3>
        <span className="mission-date">Today</span>
      </div>

      <div className="mission-item">
        <div className="mission-progress-container">
          <svg viewBox="0 0 36 36" className="donut-chart">
            <path
              className="donut-ring"
              d="M18 2.0845
                a 15.9155 15.9155 0 0 1 0 31.831
                a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              className="donut-segment"
              strokeDasharray={strokeDasharray}
              strokeDashoffset="25"
              d="M18 2.0845
                a 15.9155 15.9155 0 0 1 0 31.831
                a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <text x="18" y="20.5" className="donut-text">
              {likeAmount}
            </text>
          </svg>
        </div>

        <div className="mission-details">
          <div className="mission-title">Like {maxLikes} Posts</div>
          <div className="mission-milestones">
            <div className={`milestone ${likeAmount >= 10 ? "reached" : ""} ${bonus10 ? "claimed" : ""}`}>
              <div className="milestone-dot"></div>
              <span>10 Likes {bonus10 && "✓"}</span>
            </div>
            <div className={`milestone ${likeAmount >= 20 ? "reached" : ""} ${bonus20 ? "claimed" : ""}`}>
              <div className="milestone-dot"></div>
              <span>20 Likes {bonus20 && "✓"}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mission-footer">
        <p>Keep liking to earn points!</p>
      </div>
    </div>
  );
};

export default DailyMissionDropdown;
