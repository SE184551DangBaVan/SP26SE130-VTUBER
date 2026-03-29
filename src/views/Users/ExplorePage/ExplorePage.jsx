import { useState, useEffect } from 'react';
import './ExplorePage.css'
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css'
import { getFanHubs, getTopFanHubs } from '@/services/FanHubController';
import { GroupRounded } from '@mui/icons-material';

export default function ExplorePage() {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [selecetedCategory, setSelecetedCategory] = useState(null);
  const [expandCategory, setExpandCategory] = useState(false);
  const [hubOwnerPfp, setHubOwnerPfp] = useState(null);
  const [hubBanner, setHubBanner] = useState(null);
  const [hubImage, setHubImage] = useState(null);

  const [topHub, setTopHub] = useState(null);
  const [topLoading, setTopLoading] = useState(true);

  const [fanHubs, setFanHubs] = useState([]);
  const [groupedHubs, setGroupedHubs] = useState({});

  useEffect(() => {
    const fetchTop = async () => {
      setTopLoading(true);

      const data = await getTopFanHubs(selecetedCategory);

      setTopHub(data[0] || null);

      setTopLoading(false);
    };

    fetchTop();
  }, [selecetedCategory]);

  useEffect(() => {
    const fetchData = async () => {
      const data = await getFanHubs();
      setFanHubs(data);

      const grouped = {}; // group by category

      data.forEach((hub) => {
        if (hub.categories?.length) {
          hub.categories.forEach((cat) => {
            if (!grouped[cat]) grouped[cat] = [];
            grouped[cat].push(hub);
          });
        }
      });
      setGroupedHubs(grouped);
    };

    fetchData();
  }, []);

  const CommunityCard = () => {
    return (
      <div className="community-card">
        <p className="community-label">
          Since you are a member of <b>Forsaken Pebbles</b>,
        </p>

        <div className="explore-banner" style={{background: `${hubBanner ? color : '#75a4c8'}`}}>
          <div className="explore-banner-left">
            <h2>CALAMITAS' HEARTH</h2>
            <button className='explore-visit-btn'>Visit Fanhub <span className='ico'>→</span></button>
          </div>

          <div className="explore-banner-right">
            {[1,2,3,4].map((i) => (
              <img key={i} src={`/assets/community-${i}.jpg`} alt=''
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "/WompWomp.png";
                }}/>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const Section = ({ category, hubs = [] }) => {
    return (
      <div className="explore-section">
        <div className="explore-section-header">
          <h3>{category} FanHubs</h3>
          <span>See more &gt;&gt;</span>
        </div>

        {hubs.length === 0 ? (
        // fallback (your old static look)
        <div className="explore-banner" style={{ background: "#333" }}>
          <div className="explore-banner-left">
            <h2>NO DATA</h2>
          </div>
        </div>
      ) : (
        hubs.map((hub, idx) => (
          <div
            key={idx}
            className="explore-banner"
            style={{
              backgroundColor: "#555",
              backgroundImage: hub.backgroundUrl
                ? `url(${hub.backgroundUrl})`
                : "#333",
              color: hub.themeColor || "#fff",
            }}
          >
            <div className="explore-banner-left">
              <div className="hub-info">
                <div className="hub-owner-info">
                  <img
                    className="hub-owner-pfp"
                    src={hub.avatarUrl || "/profile-pic-undefined.jpg"}
                    alt=""
                    onError={(e) => {
                      e.target.src = "/profile-pic-undefined.jpg";
                    }}
                  />
                  <div className="hub-owner-info-display">
                    <div className="hub-owner-display-name">
                      <span>Owned by:</span>
                      <span>{hub.ownerDisplayName}</span>
                    </div>
                  </div>
                </div>

                <h2>{hub.hubName?.toUpperCase()}</h2>

                <div className="hub-info-member-count">
                  <span>{topHub?.memberCount ?? "N/A"}</span> <GroupRounded />
                </div>
              </div>

              <button className="explore-visit-btn">
                Visit Fanhub <span className="ico">→</span>
              </button>
            </div>

            <div className="explore-banner-right">
              {[1, 2, 3, 4].map((i) => (
                <img
                  key={i}
                  src={`/assets/featured-${i}.jpg`}
                  alt=""
                  onError={(e) => {
                    e.target.src = "/WompWomp.png";
                  }}
                />
              ))}
            </div>
          </div>
        ))
      )}
      </div>
    )
  }

  return (
    <div className='explore-page-container'>
      <div className='explore-page-content'>
        <div className='explore-category-controls'>
          <div className="category-search-bar">
            <svg className="category-search-bar-icon" aria-hidden="true" viewBox="0 0 24 24"><g><path d="M21.53 20.47l-3.66-3.66C19.195 15.24 20 13.214 20 11c0-4.97-4.03-9-9-9s-9 4.03-9 9 4.03 9 9 9c2.215 0 4.24-.804 5.808-2.13l3.66 3.66c.147.146.34.22.53.22s.385-.073.53-.22c.295-.293.295-.767.002-1.06zM3.5 11c0-4.135 3.365-7.5 7.5-7.5s7.5 3.365 7.5 7.5-3.365 7.5-7.5 7.5-7.5-3.365-7.5-7.5z"></path></g></svg>
            <input placeholder="Search" type="search" className="category-search-bar-input" />
          </div>
          <div className='see-more-category'>
            <button className='see-more-category-btn' onClick={() => setExpandCategory(!expandCategory)}>See More <span>&gt;&gt;</span></button>
          </div>
        </div>
        <div className={`category-row ${expandCategory ? 'expand' : ''}`} >
          {["Gaming", "Just Chatting", "Music", "ASMR", "Cooking", "Art"].map((cat, i) => (
          <div
            key={i}
            className="category-card"
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(null)}
            onClick={() => setSelecetedCategory(cat)}
          >
            <img
              src={hoveredIndex === i 
                ? `/category-${i + 1}.gif` 
                : `/category-${i + 1}.png`}
              alt={cat} 
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "/WompWomp.png";
              }}
            />
            <span>{cat}</span>
          </div>
        ))}
        </div>

        <div className="explore-section top-hubs">
          <h3>⭐ Top {selecetedCategory} FanHub</h3>
          <div className="explore-banner"
            style={{
              backgroundColor: '#e7bc21',
              backgroundImage: topHub?.backgroundUrl
                ? `url(${topHub.backgroundUrl})`
                : "#999",
              color: topHub?.themeColor || "#fff",
            }}
          >
            <div className="explore-banner-left">
              <div className="hub-info">
                <div className="hub-owner-info">
                  <img
                    className="hub-owner-pfp"
                    src={topHub?.avatarUrl || "/profile-pic-undefined.jpg"}
                    alt=""
                    onError={(e) => {
                      e.target.src = "/profile-pic-undefined.jpg";
                    }}
                  />

                  <div className="hub-owner-info-display">
                    <div className="hub-owner-display-name">
                      <span>Owned by:</span>
                      <span>{topHub?.ownerDisplayName || "Unknown"}</span>
                    </div>
                  </div>
                </div>

                <h2>{topHub?.hubName?.toUpperCase() || "NO HUB"}</h2>

                <div className="hub-info-member-count">
                  <span>{topHub?.memberCount ?? "N/A"}</span> <GroupRounded />
                </div>
              </div>

              <button className="explore-visit-btn">
                Visit Fanhub <span className="ico">→</span>
              </button>
            </div>

            <div className="explore-banner-right">
              {topLoading ? (
                [1, 2, 3, 4].map((i) => (
                  <SkeletonTheme key={i} baseColor="#d7d7d7" highlightColor="#ffffff">
                    <Skeleton />
                  </SkeletonTheme>
                ))
              ) : (
                [1, 2, 3, 4].map((i) => (
                  <SkeletonTheme key={i} baseColor="#d7d7d7" highlightColor="#ffffff">
                    <Skeleton />
                  </SkeletonTheme>
                ))
              )}
            </div>
          </div>
          <a href="https://landfall.se/peak" target="_blank" rel="noopener noreferrer" className='art-credits'>Art by: Landfall</a>
        </div>

        {Object.keys(groupedHubs).length === 0 ? (
          <>
            <Section category="Can't Find Any" />
          </>
        ) : (
          Object.entries(groupedHubs).map(([category, hubs]) => (
            <Section key={category} category={category} hubs={hubs} />
          ))
        )}

        <div className="more-divider">
          <span>More by categories</span>
        </div>

        {[1,2,3].map((i) => (
          <CommunityCard key={i} />
        ))}

      </div>
    </div>
  )
}
