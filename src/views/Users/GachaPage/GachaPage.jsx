"use client";

import { useEffect, useState } from "react";
import { useSideBar } from "@/contexts/SideBarContext";
import { getCurrentUserProfile } from "@/services/UserController";
import "./GachaPage.css";

// Mock banner data
const MOCK_BANNERS = [
  {
    id: 1,
    name: "Hehehehaw",
    description: "heheaehehaeahaheahaeheeaeh\nveri kool banner\nthere shouldn't be outlines like these",
    duration: "Permanent",
    image: "/gacha/banner-default.jpg",
  },
  {
    id: 2,
    name: "Dino World Collection",
    description: "Collect adorable dinosaur companions!\nEach summon has a chance to reveal rare and legendary dinos.",
    duration: "Apr 1 – Apr 30, 2026",
    image: "/gacha/banner-dino.jpg",
  },
  {
    id: 3,
    name: "Fantasy Kingdom",
    description: "Enter a realm of knights, dragons, and magic.\nSummon legendary heroes to build your ultimate fantasy team.",
    duration: "May 1 – May 31, 2026",
    image: "/gacha/banner-fantasy.jpg",
  },
];

export default function GachaPage() {
  const { sideBarRetractor } = useSideBar();
  const [selectedBannerIndex, setSelectedBannerIndex] = useState(0);
  const [userPoints, setUserPoints] = useState(0);
  const [loading, setLoading] = useState(true);

  const selectedBanner = MOCK_BANNERS[selectedBannerIndex];

  // Fetch user profile for points
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const data = await getCurrentUserProfile();
        if (data) {
          setUserPoints(data.points || 0);
        }
      } catch (error) {
        console.error("Failed to fetch user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handlePrevBanner = () => {
    setSelectedBannerIndex((prev) =>
      prev === 0 ? MOCK_BANNERS.length - 1 : prev - 1
    );
  };

  const handleNextBanner = () => {
    setSelectedBannerIndex((prev) =>
      prev === MOCK_BANNERS.length - 1 ? 0 : prev + 1
    );
  };

  const handleSelectBanner = (index) => {
    setSelectedBannerIndex(index);
  };

  const handleSummon = (count) => {
    console.log(`summon x${count} clicked!`);
  };

  const handleShopCartClick = () => {
    console.log("shop cart clicked!");
  };

  if (loading) {
    return (
      <div className={`gacha-page ${!sideBarRetractor ? "sidebar-retracted" : "sidebar-expanded"}`}>
        <div className="gacha-loading">
          <div className="loading-spinner"></div>
          <p>Loading Gacha Shop...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`gacha-page ${!sideBarRetractor ? "sidebar-retracted" : "sidebar-expanded"}`}>
      {/* Left Sidebar - Banner List */}
      {!sideBarRetractor && (
        <div className="gacha-banner-sidebar">
          {MOCK_BANNERS.map((banner, index) => (
            <button
              key={banner.id}
              className={`banner-sidebar-btn ${index === selectedBannerIndex ? "active" : ""}`}
              onClick={() => handleSelectBanner(index)}
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
          <div className="points-icon">💎</div>
          <span className="points-value">{userPoints}</span>
        </div>

        {/* Pagination Dots */}
        <div className="gacha-pagination">
          {MOCK_BANNERS.map((_, index) => (
            <button
              key={index}
              className={`pagination-dot ${index === selectedBannerIndex ? "active" : ""}`}
              onClick={() => handleSelectBanner(index)}
            />
          ))}
        </div>

        {/* Banner Content - Sliding Carousel */}
        <div className="banner-carousel">
          {/* Navigation Arrows */}
          <button className="banner-arrow banner-arrow-left" onClick={handlePrevBanner}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button className="banner-arrow banner-arrow-right" onClick={handleNextBanner}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>

          {/* Carousel Track */}
          <div className="banner-carousel-track" style={{ transform: `translateX(-${selectedBannerIndex * 100}%)` }}>
            {MOCK_BANNERS.map((banner) => (
              <div key={banner.id} className="banner-slide">
                <div className="banner-text-overlay">
                  <h1 className="banner-title">{banner.name}</h1>
                  <span className="banner-duration">{banner.duration}</span>
                  <p className="banner-description">{banner.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Action Bar (outside carousel, shared) */}
          <div className="banner-bottom-bar">
            {/* Left: Icon Buttons */}
            <div className="banner-icon-buttons">
              <button className="icon-btn" title="Info">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <circle cx="10" cy="9" r="1"/>
                </svg>
              </button>
              <button className="icon-btn" onClick={handleShopCartClick} title="Shop">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="9" cy="21" r="1"/>
                  <circle cx="20" cy="21" r="1"/>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                </svg>
              </button>
              <button className="icon-btn" title="History">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <circle cx="12" cy="16" r="1"/>
                  <line x1="12" y1="12" x2="12" y2="15"/>
                </svg>
              </button>
            </div>

            {/* Right: Summon Buttons */}
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
    </div>
  );
}
