import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import './ExplorePage.css'
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css'
import { getFanHubs, getTopFanHubs } from '@/services/FanHubController';
import { GroupRounded } from '@mui/icons-material';

import NothingHere from '../../../assets/Decor/loading-9.gif'
import RetroWindow from '@/components/RetroWindow/RetroWindow';

import ExploreBanner from '@/components/ExploreBanner/ExploreBanner';
import { HUB_CATEGORIES } from '@/constants/hubCategories';

const ITEMS_PER_SECTION = 6;

export default function ExplorePage() {
  const router = useRouter();
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [selecetedCategory, setSelecetedCategory] = useState(null);
  const [expandCategory, setExpandCategory] = useState(false);
  
  const [topHub, setTopHub] = useState(null);
  const [topLoading, setTopLoading] = useState(true);

  const [fanHubs, setFanHubs] = useState([]);
  const [groupedHubs, setGroupedHubs] = useState({});
  
  // State for tracking how many items to show per category
  const [visibleItems, setVisibleItems] = useState({});
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  const handleVisitHub = (hub) => {
    // Navigate using subdomain
    if (hub && hub.subdomain) {
      router.push(`/hub/${hub.subdomain}`);
    } else {
      console.warn('Hub does not have subdomain');
    }
  };

  // Handle showing more items for a category
  const handleShowMore = (category) => {
    setVisibleItems((prev) => ({
      ...prev,
      [category]: (prev[category] || ITEMS_PER_SECTION) + ITEMS_PER_SECTION,
    }));
  };
  
  // Handle search input change
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    // Only search if length is greater than 3
    if (value.length > 2) {
      const query = value.toLowerCase();
      const filtered = fanHubs.filter((hub) => 
        hub.hubName?.toLowerCase().includes(query)
      );
      
      // Sort by memberCount descending
      const sorted = filtered.sort((a, b) => {
        const countA = a.memberCount || 0;
        const countB = b.memberCount || 0;
        return countB - countA;
      });
      
      setSearchResults(sorted);
    } else {
      setSearchResults([]);
    }
  };

  useEffect(() => {
    const fetchTop = async () => {
      setTopLoading(true);

      const data = await getTopFanHubs(selecetedCategory);

      setTopHub(data[0] || null);

      setTopLoading(false);
    };

    fetchTop();
  }, []);

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
      
      // Initialize visible items for each category
      const initialVisible = {};
      Object.keys(grouped).forEach((cat) => {
        initialVisible[cat] = ITEMS_PER_SECTION;
      });
      setVisibleItems(initialVisible);
      
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

  const SimplifiedSection = ({ category, hubs = [] }) => {
    const visibleCount = visibleItems[category] || ITEMS_PER_SECTION;
    const visibleHubs = hubs.slice(0, visibleCount);
    const hasMore = hubs.length > visibleCount;

    return (
      <div className={`explore-section simplified ${selecetedCategory && 'focus'}`}>
        <div className="explore-section-header">
          <h3>Recommended <span>{category}</span> FanHubs</h3>
        </div>

        {hubs.length === 0 ? (
          <div className="simplified-empty-message">
            <img
                className='simplified-empty-message-animation'
                src={NothingHere.src}
                alt=""
                onError={(e) => {
                  e.target.src = "/picture-not-available-photo.jpg";
                }}
              />
            No Fan Hub In This Category Yet, Dear Friend~
          </div>
        ) : (
          <>
            <div className="simplified-grid">
              {visibleHubs.map((hub, idx) => (
                <div
                  key={idx}
                  className="simplified-card"
                  onClick={() => handleVisitHub(hub)}
                >
                  <div className="simplified-card-header">
                    <img
                      className="simplified-card-avatar"
                      src={hub.avatarUrl || "/profile-pic-undefined.jpg"}
                      alt=""
                      onError={(e) => {
                        e.target.src = "/profile-pic-undefined.jpg";
                      }}
                    />
                    <div className="simplified-card-title">
                      <span className="simplified-card-name">{hub.hubName}</span>
                      <span className="simplified-card-visitors">
                        {hub?.memberCount ?? "N/A"} members
                      </span>
                    </div>
                    <button className="simplified-join-btn stylised-btn">
                      <span className="stylised-text">Visit</span>
                    </button>
                  </div>
                  <p className="simplified-card-description">
                    {hub.description || `Join the ${hub.hubName} community and connect with other fans!`}
                  </p>
                </div>
              ))}
            </div>

            {hasMore && (
              <div className="simplified-show-more">
                <button className="simplified-show-more-btn" onClick={() => handleShowMore(category)}>
                  Show more
                </button>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  const Section = ({ category, hubs = [] }) => {
    return (
      <div className="explore-section">
        <h3>Search Results:</h3>
        {hubs.length === 0 ? (
          <div className="explore-banner" style={{ background: "#333", justifyContent: 'center', alignItems: 'center' }}>
            <div className="explore-banner-left">
              <h2>(NO DATA)</h2>
            </div>
          </div>
        ) : (
          hubs.map((hub, idx) => (
            <ExploreBanner
              key={idx}
              bannerUrl={hub.bannerUrl}
              themeColor={hub.themeColor}
              avatarUrl={hub.avatarUrl}
              ownerDisplayName={hub.ownerDisplayName}
              hubName={hub.hubName}
              memberCount={hub.memberCount}
              highlightImgUrls={hub.highlightImgUrls}
              onVisit={() => handleVisitHub(hub)}
            />
          ))
        )}
      </div>
    )
  }

  return (
    <div className='explore-page-container'>
      <div className='explore-background-grid'></div>
      <div className='explore-page-content'>
        <div className='explore-category-controls'>
          <div className="category-search-bar">
            <svg className="category-search-bar-icon" aria-hidden="true" viewBox="0 0 24 24"><g><path d="M21.53 20.47l-3.66-3.66C19.195 15.24 20 13.214 20 11c0-4.97-4.03-9-9-9s-9 4.03-9 9 4.03 9 9 9c2.215 0 4.24-.804 5.808-2.13l3.66 3.66c.147.146.34.22.53.22s.385-.073.53-.22c.295-.293.295-.767.002-1.06zM3.5 11c0-4.135 3.365-7.5 7.5-7.5s7.5 3.365 7.5 7.5-3.365 7.5-7.5 7.5-7.5-3.365-7.5-7.5z"></path></g></svg>
            <input 
              placeholder="Search (Enter at least 3 letters)" 
              type="search" 
              className="category-search-bar-input" 
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>
        </div>
        
        {/* Search Results Section */}
        {searchQuery.length > 3 && (
          <div className="search-results-container">
            {searchResults.length > 0 ? (
              <Section
                category="Search Results"
                hubs={searchResults}
              />
            ) : (
              <div className="search-no-results">
                No FanHubs Matches Search
              </div>
            )}
          </div>
        )}
        <div className='see-more-category'>
          <button className='see-more-category-btn' onClick={() => setExpandCategory(!expandCategory)}>See More <span>&gt;&gt;</span></button>
        </div>
        <div className={`category-row ${expandCategory ? 'expand' : ''}`} >
          {HUB_CATEGORIES.map((cat, i) => (
          <div
            key={i}
            className="category-card"
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(null)}
            onClick={() => setSelecetedCategory(cat.name)}
          >
            <img
              src={hoveredIndex === i 
                ? `/category-${cat.imageId}.gif` 
                : `/category-${cat.imageId}.png`}
              alt={cat.name} 
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "/WompWomp.png";
              }}
            />
            <span>{cat.name}</span>
          </div>
        ))}
        </div>

        <RetroWindow
          windowWidth="100%" 
          windowHeight="fit-content"
          windowColor="yellow" //there is only red, blue, yellow
          windowTitle="Top FanHub"
          windowContent={(
            <div className="explore-section top-hubs" >
              <h3>Most Popular FanHubs:</h3>
              <div className='explore-banner-list'>
                <ExploreBanner
                  bannerUrl={topHub?.bannerUrl}
                  themeColor={topHub?.themeColor}
                  avatarUrl={topHub?.avatarUrl}
                  ownerDisplayName={topHub?.ownerDisplayName}
                  hubName={topHub?.hubName}
                  memberCount={topHub?.memberCount}
                  highlightImgUrls={topHub?.highlightImgUrls}
                  onVisit={() => handleVisitHub(topHub)}
                  loading={topLoading}
                />
              </div>
              <a href="https://landfall.se/peak" target="_blank" rel="noopener noreferrer" className='art-credits'>Art by: Landfall</a>
            </div>
          )}
        />

        {Object.keys(groupedHubs).length === 0 ? (
          <> </>
        ) : (
          <RetroWindow
          windowWidth="fit-content" 
          windowHeight="fit-content"
          windowColor="blue" //there is only red, blue, yellow
          windowTitle="Recommended Categories"
          windowContent={(
            typeof window !== 'undefined' && localStorage.getItem('username') || sessionStorage.getItem('username') ? (
              HUB_CATEGORIES.map((cat) => (
              <SimplifiedSection
                key={cat.name}
                category={cat.name}
                hubs={groupedHubs[cat.name] || []}
              />
            ))
          ) : null)}
        />
        )}

        <div className="more-divider">
          <span>More by categories</span>
        </div>

        {/* {[1,2,3].map((i) => (
          <CommunityCard key={i} />
        ))} */}

      </div>
    </div>
  )
}







