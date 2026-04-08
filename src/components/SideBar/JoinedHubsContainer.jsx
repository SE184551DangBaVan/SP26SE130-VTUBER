'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUserById } from '@/services/UserController';
import { getFanHubBySubdomain } from '@/services/FanHubController';
import './JoinedHubsContainer.css';

export default function JoinedHubsContainer() {
  const router = useRouter();
  const [showAll, setShowAll] = useState(false);
  const [joinedHubs, setJoinedHubs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJoinedHubs = async () => {
      try {
        // Get userID from localStorage or sessionStorage
        const userId = localStorage.getItem('userID') || sessionStorage.getItem('userID');

        if (!userId) {
          setLoading(false);
          return;
        }

        // Fetch user data including fanHubsJoined
        const userData = await getUserById(userId);

        if (userData && userData.fanHubsJoined) {
          setJoinedHubs(userData.fanHubsJoined);
        }

        setLoading(false);
      } catch (error) {
        console.error('Error fetching joined hubs:', error);
        setLoading(false);
      }
    };

    fetchJoinedHubs();
  }, []);

  const handleHubClick = (subdomain) => {
    router.push(`/hub/${subdomain}`);
  };

  const toggleShowAll = () => {
    setShowAll(!showAll);
  };

  // Determine which hubs to display
  const displayHubs = showAll ? joinedHubs : joinedHubs.slice(0, 3);
  const hasMoreHubs = joinedHubs.length > 3;

  // Don't render if no hubs joined
  if (joinedHubs.length === 0 && !loading) {
    return null;
  }

  return (
    <div className="joined-hubs-wrapper">
      <div className="joined-hubs-header">
        <span className="joined-hubs-label">Joined hubs</span>
      </div>

      <div className="joined-hubs-list">
        {loading ? (
          <div className="joined-hubs-loading">Loading...</div>
        ) : joinedHubs.length === 0 ? (
          <div className="joined-hubs-empty">No hubs joined.</div>
        ) : (
          <>
            {displayHubs.map((hub) => (
              <div
                key={hub.fanHubId}
                className="joined-hub-item"
                onClick={() => handleHubClick(hub.subdomain)}
              >
                <img
                  src={hub.avatarUrl || '/default-avatar.png'}
                  alt={hub.hubName}
                  className="joined-hub-avatar"
                />
                <span className="joined-hub-name">{hub.hubName}</span>
              </div>
            ))}

            {hasMoreHubs && (
              <div
                className="view-all-hubs"
                onClick={toggleShowAll}
              >
                {showAll ? 'Show less' : 'View all hubs...'}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
