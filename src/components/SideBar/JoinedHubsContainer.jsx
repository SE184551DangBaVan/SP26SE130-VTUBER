'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getMyJoinedHubs } from '@/services/FanHubController';
import { useAuth } from '@/functions/Auth/useAuth';
import './JoinedHubsContainer.css';

export default function JoinedHubsContainer() {
  const router = useRouter();
  const { userAuth } = useAuth();
  const [joinedHubs, setJoinedHubs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only fetch if user is logged in
    if (!userAuth) {
      setLoading(false);
      setJoinedHubs([]);
      return;
    }

    const fetchJoinedHubs = async () => {
      try {
        setLoading(true);
        // Fetch 6 hubs to check if there are more than 5
        const hubs = await getMyJoinedHubs(0, 6, 'createdAt');
        // Store all fetched hubs
        setJoinedHubs(hubs);
      } catch (error) {
        console.error('Error fetching joined hubs:', error);
        setJoinedHubs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchJoinedHubs();
  }, [userAuth]);



  const handleHubClick = (subdomain) => {
    router.push(`/hub/${subdomain}`);
  };

  // Determine which hubs to display
  const hasMoreHubs = joinedHubs.length > 5;
  const displayHubs = joinedHubs.slice(0, 5);

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
                onClick={() => router.push('/my-hubs')}
              >
                See more...
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
