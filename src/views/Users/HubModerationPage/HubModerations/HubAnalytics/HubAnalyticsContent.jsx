"use client";

import { useState, useEffect } from "react";
import { getHubAnalytics } from "@/services/FanHubController";
import "./HubAnalyticsContent.css";

export default function HubAnalyticsContent({ fanHubId }) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const data = await getHubAnalytics(fanHubId);
        setAnalytics(data);
      } catch (error) {
        console.error("Error fetching hub analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    if (fanHubId) {
      fetchAnalytics();
    }
  }, [fanHubId]);

  if (loading) {
    return (
      <div className="hub-analytics-content">
        <div className="analytics-loading">
          <div className="spinner"></div>
          <p>Loading hub analytics...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="hub-analytics-content">
        <div className="analytics-error">
          <p>Failed to load analytics data.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="hub-analytics-content">
      <div className="analytics-header">
        <h2>Hub Analytics</h2>
        <p className="analytics-description">
          Overview of your Fan Hub's performance and member activity.
        </p>
      </div>

      <div className="analytics-stats-grid">
        <div className="stat-card">
          <span className="stat-label">Total Members</span>
          <span className="stat-value">{analytics.totalJoinedMembers}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Total Posts</span>
          <span className="stat-value">{analytics.totalPosts}</span>
        </div>
        <div className="stat-card highlighted">
          <span className="stat-label">Total Strikes</span>
          <span className="stat-value">{analytics.totalStrikes}</span>
        </div>
      </div>

      <div className="analytics-sections">
        <section className="analytics-section">
          <h3>Top Members</h3>
          <div className="top-members-list">
            {analytics.topMembers && analytics.topMembers.length > 0 ? (
              analytics.topMembers.map((member) => (
                <div key={member.id} className="top-member-item">
                  <img 
                    src={member.avatarUrl || '/profile-pic-undefined.jpg'} 
                    alt={member.displayName} 
                    className="member-avatar"
                    onError={(e) => { e.target.src = '/profile-pic-undefined.jpg'; }}
                  />
                  <div className="member-info">
                    <span className="member-name">{member.displayName}</span>
                    <span className="member-username">@{member.username}</span>
                  </div>
                  <div className="member-stats">
                    <span className="member-score">Score: {member.fanHubScore}</span>
                    <span className="member-role">{member.roleInHub}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="no-data">No top members found.</p>
            )}
          </div>
        </section>

        <section className="analytics-section">
          <h3>Recent Strikes</h3>
          <div className="strikes-history">
            {analytics.strikes && analytics.strikes.length > 0 ? (
              <div className="strikes-table-container">
                <table className="strikes-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.strikes.map((strike, index) => (
                      <tr key={index}>
                        <td>{new Date(strike.createdAt).toLocaleDateString()}</td>
                        <td className="strike-reason">{strike.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="no-strikes-card">
                <p>No strikes found for this Fan Hub. Keep it up!</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
