'use client';

import { useEffect, useState, useCallback } from 'react';
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
  const [isPaused, setIsPaused] = useState(false);

  // Summon confirmation modal
  const [showSummonModal, setShowSummonModal] = useState(false);
  const [summonCount, setSummonCount] = useState(1);

  // Gacha result popup
  const [showGachaResult, setShowGachaResult] = useState(false);
  const [gachaResults, setGachaResults] = useState([]);
  const [revealPhase, setRevealPhase] = useState('idle'); // 'idle' | 'reveal' | 'summary'
  const [revealIndex, setRevealIndex] = useState(0);
  const [revealedItems, setRevealedItems] = useState([]);

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

  // Calculate duration text
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

  // Carousel navigation
  const handlePrev = useCallback(() => {
    setSelectedIndex((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
  }, [banners.length]);

  const handleNext = useCallback(() => {
    setSelectedIndex((prev) => (prev === banners.length - 1 ? 0 : prev + 1));
  }, [banners.length]);

  // Autoplay
  useEffect(() => {
    if (banners.length <= 1 || isPaused) return;

    const interval = setInterval(() => {
      handleNext();
    }, 5000);

    return () => clearInterval(interval);
  }, [banners.length, isPaused, handleNext]);

  // Tooltip handlers
  const handleTooltipMove = useCallback((e, item) => {
    setTooltip({ visible: true, x: e.clientX, y: e.clientY, item });
  }, []);

  const handleTooltipLeave = useCallback(() => {
    setTooltip({ visible: false, x: 0, y: 0, item: null });
  }, []);

  // Summon logic
  const handleSummon = (count) => {
    setSummonCount(count);
    setShowSummonModal(true);
  };

  const handleConfirmSummon = async () => {
    setShowSummonModal(false);
    if (!selectedBanner) return;

    const totalPulls = summonCount;
    const results = [];

    for (let i = 0; i < totalPulls; i++) {
      const result = await doGachaPull(selectedBanner.bannerId);
      if (result) results.push(result);
    }

    setGachaResults(results);
    setShowGachaResult(true);

    if (results.length <= 1) {
      setRevealPhase('summary');
      setRevealedItems(results);
    } else {
      setRevealPhase('reveal');
      setRevealIndex(0);
      setRevealedItems([]);
    }

    // Refresh points
    try {
      const profile = await getCurrentUserProfile();
      if (profile) setUserPoints(profile.points || 0);
    } catch (err) {
      console.error('Error refreshing points:', err);
    }
  };

  const handleCancelSummon = () => setShowSummonModal(false);

  const handleNextReveal = useCallback(() => {
    if (revealIndex < gachaResults.length - 1) {
      setRevealedItems((prev) => [...prev, gachaResults[revealIndex]]);
      setRevealIndex((prev) => prev + 1);
    } else {
      setRevealedItems((prev) => [...prev, gachaResults[revealIndex]]);
      setRevealPhase('summary');
    }
  }, [revealIndex, gachaResults]);

  const handleBackdropClick = useCallback(() => {
    if (revealPhase === 'summary') {
      handleGachaResultClose();
    } else {
      handleNextReveal();
    }
  }, [revealPhase, handleNextReveal]);

  const handleGachaResultClose = () => {
    setShowGachaResult(false);
    setGachaResults([]);
    setRevealPhase('idle');
    setRevealIndex(0);
    setRevealedItems([]);
  };

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
      {/* SVG Filters for glow */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <filter width="300%" x="-100%" height="300%" y="-100%" id="unopaq">
          <feColorMatrix values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 9 0" />
        </filter>
        <filter width="300%" x="-100%" height="300%" y="-100%" id="unopaq2">
          <feColorMatrix values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 3 0" />
        </filter>
      </svg>

      {/* Sidebar List */}
      {banners.length > 1 && (
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

      {/* Main Container */}
      <div className="gacha-banner-area">
        {/* Points */}
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

        {/* Carousel */}
        <div 
          className="banner-carousel"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {banners.length > 1 && (
            <>
              <button className="banner-arrow banner-arrow-left" onClick={handlePrev}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <button className="banner-arrow banner-arrow-right" onClick={handleNext}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </>
          )}

          <div
            className="banner-carousel-track"
            style={{ transform: `translateX(-${selectedIndex * 100}%)` }}
          >
            {banners.map((banner) => (
              <div key={banner.bannerId} className="banner-slide">
                <div 
                  className="banner-background" 
                  style={{ background: `url('${banner.bannerImgUrl}')` }}
                />
                <div className="banner-text-overlay">
                  <span className="banner-duration">
                    {getDurationText(banner.startTime, banner.endTime)}
                  </span>
                  <h1 className="banner-title">{banner.name}</h1>
                  <p className="banner-description">{banner.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Controls Bar */}
          <div className="banner-bottom-bar">
            <div className="banner-icon-buttons">
              <button className="icon-btn" title="Info">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <circle cx="12" cy="13" r="3" />
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

      {/* Confirmation Modal */}
      {showSummonModal && (
        <div className="summon-modal-backdrop" onClick={handleCancelSummon}>
          <div className="summon-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="summon-modal-corner-tl" />
            <div className="summon-modal-corner-br" />
            <h2 className="summon-modal-banner-name">{selectedBanner?.name}</h2>
            <p className="summon-modal-question">
              Spend <span className="summon-modal-cost">{totalCost}</span> Pts for x{summonCount} rolls?
            </p>
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

      {/* Result Popup */}
      {showGachaResult && (
        <div className="gacha-result-backdrop" onClick={handleBackdropClick}>
          <div className="gacha-result-content" onClick={(e) => e.stopPropagation()}>
            {revealPhase === 'reveal' && gachaResults[revealIndex] && (
              <>
                <h2 className="gacha-result-title">New Item!</h2>
                <div 
                  key={revealIndex}
                  className={`gacha-result-card ${gachaResults[revealIndex].type === 'MAIN_REWARD' ? 'main-reward' : 'good-luck'} gacha-reveal-card`}
                  onMouseMove={(e) => handleTooltipMove(e, gachaResults[revealIndex])}
                  onMouseLeave={handleTooltipLeave}
                >
                  <div className="gacha-result-card-inner">
                    {gachaResults[revealIndex].type === 'MAIN_REWARD' && (
                      <div className="gacha-spin-wrap">
                        <div className="gacha-backdrop" />
                        <div className="gacha-spin gacha-spin-blur" />
                        <div className="gacha-spin gacha-spin-intense" />
                      </div>
                    )}
                    <img src={gachaResults[revealIndex].imageUrl} alt={gachaResults[revealIndex].itemName} className="gacha-result-image" />
                    <span className="gacha-result-name">{gachaResults[revealIndex].itemName}</span>
                  </div>
                </div>
                <p className="gacha-result-hint">Click anywhere to continue</p>
              </>
            )}

            {revealPhase === 'summary' && (
              <>
                <h2 className="gacha-result-title">Summon Results</h2>
                {revealedItems.length === 1 ? (
                  <div className="gacha-single-result">
                    <div
                      className={`gacha-result-card ${revealedItems[0].type === 'MAIN_REWARD' ? 'main-reward' : 'good-luck'} gacha-summary-card`}
                      onMouseMove={(e) => handleTooltipMove(e, revealedItems[0])}
                      onMouseLeave={handleTooltipLeave}
                    >
                      <div className="gacha-result-card-inner">
                        {revealedItems[0].type === 'MAIN_REWARD' && (
                          <div className="gacha-spin-wrap">
                            <div className="gacha-backdrop" />
                            <div className="gacha-spin gacha-spin-blur" />
                            <div className="gacha-spin gacha-spin-intense" />
                          </div>
                        )}
                        <img src={revealedItems[0].imageUrl} alt={revealedItems[0].itemName} className="gacha-result-image" />
                        <span className="gacha-result-name">{revealedItems[0].itemName}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="gacha-items-summary">
                    {revealedItems.map((item, index) => (
                      <div 
                        key={index} 
                        className={`gacha-result-card ${item.type === 'MAIN_REWARD' ? 'main-reward' : 'good-luck'} gacha-summary-card`}
                        style={{ animationDelay: `${index * 0.08}s` }}
                        onMouseMove={(e) => handleTooltipMove(e, item)}
                        onMouseLeave={handleTooltipLeave}
                      >
                        <div className="gacha-result-card-inner">
                          {item.type === 'MAIN_REWARD' && (
                            <div className="gacha-spin-wrap">
                              <div className="gacha-backdrop" />
                              <div className="gacha-spin gacha-spin-blur" />
                              <div className="gacha-spin gacha-spin-intense" />
                            </div>
                          )}
                          <img src={item.imageUrl} alt={item.itemName} className="gacha-result-image" />
                          <span className="gacha-result-name">{item.itemName}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <p className="gacha-result-hint">Click anywhere to close</p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Tooltip */}
      {tooltip.visible && tooltip.item && (
        <div className="gacha-item-tooltip" style={{ left: tooltip.x + 16, top: tooltip.y - 10 }}>
          <span>{tooltip.item.itemName}</span> <br/>
          <span className="tooltip-cost">{tooltip.item.cost} Pts</span>
        </div>
      )}
    </div>
  );
}
