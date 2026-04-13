'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useSideBar } from '@/contexts/SideBarContext';
import { getCurrentUserProfile } from '@/services/UserController';
import { getActiveBanners, doGachaPull } from '@/services/GachaBannerController';
import PointsIco from '../../../assets/UI-Elements/Coin.png';
import './GachaPage.css';

export default function GachaPage() {
  const { sideBarRetractor } = useSideBar();

  // Banners & user data
  const [banners, setBanners] = useState([]);
  const [userPoints, setUserPoints] = useState(0);
  const [loading, setLoading] = useState(true);

  // Carousel state
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Summon confirmation modal
  const [showSummonModal, setShowSummonModal] = useState(false);
  const [summonCount, setSummonCount] = useState(1);

  // Gacha result popup
  const [showGachaResult, setShowGachaResult] = useState(false);
  const [gachaResults, setGachaResults] = useState([]);
  const [gachaAnimating, setGachaAnimating] = useState(false);

  // Tooltip state
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, item: null });

  const selectedBanner = banners[selectedIndex];

  // Fetch banners and user profile
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bannerData, profile] = await Promise.all([
          getActiveBanners(),
          getCurrentUserProfile(),
        ]);

        setBanners(bannerData);
        if (profile) setUserPoints(profile.points || 0);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calculate duration text from startTime to endTime
  const getDurationText = useCallback((startTime, endTime) => {
    if (!startTime || !endTime) return 'Permanent';
    const now = new Date();
    const end = new Date(endTime);
    const diffMs = end - now;
    if (diffMs <= 0) return 'Expired';
    const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    if (days > 1) return `${days}d left`;
    const hours = Math.ceil(diffMs / (1000 * 60 * 60));
    return `${hours}h left`;
  }, []);

  // Carousel navigation (infinite cycle)
  const handlePrev = useCallback(() => {
    setSelectedIndex((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
  }, [banners.length]);

  const handleNext = useCallback(() => {
    setSelectedIndex((prev) => (prev === banners.length - 1 ? 0 : prev + 1));
  }, [banners.length]);

  // Tooltip handlers
  const handleTooltipMove = useCallback((e, item) => {
    setTooltip({ visible: true, x: e.clientX, y: e.clientY, item });
  }, []);

  const handleTooltipLeave = useCallback(() => {
    setTooltip({ visible: false, x: 0, y: 0, item: null });
  }, []);

  // Summon click -> show confirmation modal
  const handleSummon = (count) => {
    setSummonCount(count);
    setShowSummonModal(true);
  };

  // Confirm summon -> perform gacha pulls
  const handleConfirmSummon = async () => {
    setShowSummonModal(false);
    if (!selectedBanner) return;

    setGachaAnimating(true);
    setGachaResults([]);
    setShowGachaResult(true);

    const totalPulls = summonCount;
    const results = [];

    for (let i = 0; i < totalPulls; i++) {
      const result = await doGachaPull(selectedBanner.bannerId);
      if (result) {
        results.push(result);
        setGachaResults([...results]);
      }
      // Small delay between pulls for visual effect
      if (i < totalPulls - 1) {
        await new Promise((resolve) => setTimeout(resolve, 400));
      }
    }

    setGachaResults(results);
    setGachaAnimating(false);

    // Refresh user points
    try {
      const profile = await getCurrentUserProfile();
      if (profile) setUserPoints(profile.points || 0);
    } catch (err) {
      console.error('Error refreshing points:', err);
    }
  };

  const handleCancelSummon = () => {
    setShowSummonModal(false);
  };

  const handleGachaResultClose = () => {
    setShowGachaResult(false);
    setGachaResults([]);
  };

  // Close gacha result when clicking backdrop (only when not animating)
  useEffect(() => {
    if (!gachaAnimating) {
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') handleGachaResultClose();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [gachaAnimating]);

  if (loading) {
    return (
      <div className={`gacha-page ${!sideBarRetractor ? 'sidebar-retracted' : 'sidebar-expanded'}`}>
        <div className="gacha-loading">
          <div className="loading-spinner"></div>
          <p>Loading Gacha Shop...</p>
        </div>
      </div>
    );
  }

  if (banners.length === 0) {
    return (
      <div className={`gacha-page ${!sideBarRetractor ? 'sidebar-retracted' : 'sidebar-expanded'}`}>
        <div className="gacha-no-banners">
          <h2>No Active Banners</h2>
          <p>There are no active gacha banners at the moment.</p>
        </div>
      </div>
    );
  }

  const totalCost = selectedBanner.gachaCost * summonCount;

  return (
    <div className={`gacha-page ${!sideBarRetractor ? 'sidebar-retracted' : 'sidebar-expanded'}`}>
      {/* Left Sidebar - Banner List */}
      {!sideBarRetractor && banners.length > 1 && (
        <div className="gacha-banner-sidebar">
          {banners.map((banner, index) => (
            <button
              key={banner.bannerId}
              className={`banner-sidebar-btn ${index === selectedIndex ? 'active' : ''}`}
              onClick={() => setSelectedIndex(index)}
            >
              {banner.name}
            </button>
          ))}
        </div>
      )}

      {/* Main Banner Area */}
      <div className="gacha-banner-area">
        {/* Points Display */}
        <div className="gacha-points-display">
          <img className="points-icon" src={PointsIco.src} alt="Points" />
          <span className="points-value">{userPoints}</span>
        </div>

        {/* Pagination Dots */}
        {banners.length > 1 && (
          <div className="gacha-pagination">
            {banners.map((_, index) => (
              <button
                key={index}
                className={`pagination-dot ${index === selectedIndex ? 'active' : ''}`}
                onClick={() => setSelectedIndex(index)}
              />
            ))}
          </div>
        )}

        {/* Banner Carousel */}
        <div className="banner-carousel">
          {/* Navigation Arrows */}
          {banners.length > 1 && (
            <>
              <button className="banner-arrow banner-arrow-left" onClick={handlePrev}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <button className="banner-arrow banner-arrow-right" onClick={handleNext}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </>
          )}

          {/* Carousel Track */}
          <div
            className="banner-carousel-track"
            style={{ transform: `translateX(-${selectedIndex * 100}%)` }}
          >
            {banners.map((banner) => (
              <div key={banner.bannerId} className="banner-slide">
                <div className="banner-text-overlay">
                  <h1 className="banner-title">{banner.name}</h1>
                  <span className="banner-duration">
                    {getDurationText(banner.startTime, banner.endTime)}
                  </span>
                  <p className="banner-description">{banner.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Action Bar */}
          <div className="banner-bottom-bar">
            <div className="banner-icon-buttons">
              <button className="icon-btn" title="Info">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <circle cx="10" cy="9" r="1" />
                </svg>
              </button>
              <button className="icon-btn" title="Shop">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="9" cy="21" r="1" />
                  <circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                </svg>
              </button>
              <button className="icon-btn" title="History">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <circle cx="12" cy="16" r="1" />
                  <line x1="12" y1="12" x2="12" y2="15" />
                </svg>
              </button>
            </div>

            <div className="banner-summon-buttons">
              <button className="summon-btn" onClick={() => handleSummon(1)}>
                Summon x1
              </button>
              <button className="summon-btn" onClick={() => handleSummon(10)}>
                Summon x10
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Summon Confirmation Modal */}
      {showSummonModal && selectedBanner && (
        <div className="summon-modal-backdrop" onClick={handleCancelSummon}>
          <div className="summon-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="summon-modal-corner-tl"></div>
            <div className="summon-modal-corner-br"></div>
            <div className="summon-modal-info">
              <h2 className="summon-modal-banner-name">{selectedBanner.name}</h2>
              <p className="summon-modal-question">
                Spend <span className="summon-modal-cost">{totalCost}</span> Pts to do a x{summonCount} roll?
              </p>
            </div>
            <div className="summon-modal-actions">
              <button className="summon-modal-btn summon-modal-btn-cancel" onClick={handleCancelSummon}>
                Cancel
              </button>
              <button className="summon-modal-btn summon-modal-btn-confirm" onClick={handleConfirmSummon}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Gacha Result Popup */}
      {showGachaResult && (
        <div className="gacha-result-backdrop" onClick={!gachaAnimating ? handleGachaResultClose : undefined}>
          <div className="gacha-result-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="gacha-result-title">
              {gachaResults.length > 1 ? `Summon x${gachaResults.length}` : 'Summon Result'}
            </h2>

            {/* Single result - zoom out animation */}
            {gachaResults.length === 1 && !gachaAnimating && (
              <div className="gacha-single-result">
                <div
                  className={`gacha-result-card ${gachaResults[0].type === 'MAIN_REWARD' ? 'main-reward' : 'good-luck'}`}
                  onMouseMove={(e) => handleTooltipMove(e, gachaResults[0])}
                  onMouseLeave={handleTooltipLeave}
                >
                  <div className="gacha-result-card-inner">
                    <img
                      src={gachaResults[0].imageUrl || '/gacha/item-default.jpg'}
                      alt={gachaResults[0].itemName}
                      className="gacha-result-image"
                    />
                    <span className="gacha-result-name">{gachaResults[0].itemName}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Multiple results - grid */}
            {gachaResults.length > 1 && !gachaAnimating && (
              <div className="gacha-items-summary">
                {gachaResults.map((item, index) => (
                  <div
                    key={index}
                    className={`gacha-result-card ${item.type === 'MAIN_REWARD' ? 'main-reward' : 'good-luck'} gacha-result-card-anim`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                    onMouseMove={(e) => handleTooltipMove(e, item)}
                    onMouseLeave={handleTooltipLeave}
                  >
                    <div className="gacha-result-card-inner">
                      <img
                        src={item.imageUrl || '/gacha/item-default.jpg'}
                        alt={item.itemName}
                        className="gacha-result-image"
                      />
                      <span className="gacha-result-name">{item.itemName}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Still animating */}
            {gachaAnimating && (
              <div className="gacha-summoning-animation">
                <div className="gacha-spin-icon">
                  <img src={selectedBanner?.bannerImgUrl || PointsIco.src} alt="" />
                </div>
                <p>Summoning...</p>
                <div className="gacha-progress-dots">
                  {Array.from({ length: summonCount }).map((_, i) => (
                    <span key={i} className={`dot ${i < gachaResults.length ? 'done' : ''}`} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Item Tooltip */}
      {tooltip.visible && tooltip.item && (
        <div
          className="gacha-item-tooltip"
          style={{ left: tooltip.x + 16, top: tooltip.y - 10 }}
        >
          <span className="tooltip-cost">{tooltip.item.cost} Pts</span>
        </div>
      )}
    </div>
  );
}
