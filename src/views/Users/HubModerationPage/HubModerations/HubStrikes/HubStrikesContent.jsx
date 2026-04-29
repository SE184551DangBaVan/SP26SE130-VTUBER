"use client";

import { useState, useEffect } from "react";
import { getFanHubStrikes } from "@/services/FanHubController";
import "./HubStrikesContent.css";

export default function HubStrikesContent({ fanHubId }) {
  const [strikes, setStrikes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStrikes = async () => {
      setLoading(true);
      try {
        const data = await getFanHubStrikes(fanHubId);
        setStrikes(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching strikes:", error);
      } finally {
        setLoading(false);
      }
    };

    if (fanHubId) {
      fetchStrikes();
    }
  }, [fanHubId]);

  if (loading) {
    return (
      <div className="hub-strikes-content">
        <div className="strikes-loading">
          <div className="spinner"></div>
          <p>Loading strike history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="hub-strikes-content">
      <div className="strikes-header">
        <h2>Hub Strikes</h2>
        <p className="strikes-description">
          Below is the history of strikes issued against your Fan Hub. Multiple strikes may lead to hub deactivation.
        </p>
      </div>

      {strikes.length === 0 ? (
        <div className="no-strikes-card">
          <div className="success-icon">✓</div>
          <h3>No strikes found!</h3>
          <p>Your Fan Hub is in good standing. Keep up the great work in following the community guidelines.</p>
        </div>
      ) : (
        <div className="strikes-list">
          <div className="strikes-table-container">
            <table className="strikes-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Reason</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {strikes.map((strike, index) => (
                  <tr key={strike.id || index}>
                    <td>{new Date(strike.createdAt).toLocaleDateString()}</td>
                    <td className="strike-reason">{strike.reason}</td>
                    <td>
                      <span className={`strike-status-badge active`}>
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="strikes-summary">
            <p>Total Strikes: <strong>{strikes.length}</strong></p>
            {strikes.length >= 3 && (
              <p className="strike-warning">
                Warning: Your hub has reached a critical number of strikes.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
