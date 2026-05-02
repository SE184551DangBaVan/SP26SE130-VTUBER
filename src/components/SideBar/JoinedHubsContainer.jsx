'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getMyJoinedHubs } from '@/services/FanHubController';
import { getMyHubAsOwner } from '@/services/FanHubController'
import { useAuth } from '@/functions/Auth/useAuth';
import './JoinedHubsContainer.css';

export default function JoinedHubsContainer() {
  const router = useRouter();
  const pathname = usePathname();
  const { userAuth } = useAuth();
  const [showAll, setShowAll] = useState(false);
  const [joinedHubs, setJoinedHubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedHubSubdomain, setSelectedHubSubdomain] = useState(null);
  const wrapperRef = useRef(null);

    const fetchJoinedHubs = async () => {
        try {
            if (!userAuth) {
                setLoading(false);
                setJoinedHubs([]);
                return;
            }
            setLoading(true);
            // Fetch 6 hubs to check if there are more than 5
            const hubs = await getMyJoinedHubs(0, 6, 'createdAt');
            const myHub = await getMyHubAsOwner();


            const filteredHubs = myHub
            ? hubs.filter(hub => hub.ownerUserId !== myHub.ownerUserId)
            : hubs;

            setJoinedHubs(filteredHubs);
        } catch (error) {
            console.error('Error fetching joined hubs:', error);
            setJoinedHubs([]);
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        fetchJoinedHubs();
    }, []);



  const handleHubClick = (subdomain) => {
    router.push(`/hub/${subdomain}`);
  };

    useEffect(() => {
        const handleHubUpdate = () => {
            fetchJoinedHubs();
        };

        window.addEventListener('hubsUpdated', handleHubUpdate);
        return () => window.removeEventListener('hubsUpdated', handleHubUpdate);
    }, []);

  // Track selected hub based on pathname
  useEffect(() => {
    const hubMatch = pathname.match(/^\/hub\/(.+)$/);
    if (hubMatch) {
      const subdomain = hubMatch[0];
      setSelectedHubSubdomain(subdomain);
    } else {
      setSelectedHubSubdomain(null);
    }
  }, [pathname]);

  // ResizeObserver to report height to parent sidebar
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const updateHeight = (height) => {
      const sidebar = document.getElementById('side-bar-content');
      if (sidebar) {
        sidebar.style.setProperty('--joined-hubs-height', `${height}px`);
      }
    };

    // Initial measurement
    updateHeight(wrapper.offsetHeight);

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const height = entry.borderBoxSize[0].blockSize;
        updateHeight(height);
      }
    });

    resizeObserver.observe(wrapper);
    return () => resizeObserver.disconnect();
  }, [showAll, joinedHubs, loading]);

  const toggleShowAll = () => {
    setShowAll(!showAll);
  };

  // Determine which hubs to display
  const hasMoreHubs = joinedHubs.length > 4;
  const displayHubs = showAll ? joinedHubs : joinedHubs.slice(0, 4);

  return (
    <div className="joined-hubs-wrapper" ref={wrapperRef}>
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
                className={`joined-hub-item ${decodeURIComponent(selectedHubSubdomain) === "/hub/" + hub.subdomain ? 'selected' : ''}`}
                onClick={() => handleHubClick(hub.subdomain)}
                title={hub.hubName}
              >
                <img
                  src={hub.avatarUrl || '/profile-pic-undefined.jpg'}
                  alt={hub.hubName}
                  className="joined-hub-avatar"
                  style={{border: `2px solid ${hub.themeColor || 'rgb(0, 25, 58)'}`}}
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

            {hasMoreHubs && (
              <div
                className="view-all-hubs-rebound-animation"
                onClick={toggleShowAll}
              >
                {showAll ? 'Show less' : 'View all'}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
