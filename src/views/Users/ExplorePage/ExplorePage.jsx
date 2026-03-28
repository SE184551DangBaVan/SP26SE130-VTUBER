import { useState } from 'react';
import './ExplorePage.css'
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css'

export default function ExplorePage() {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [selecetedCategory, setSelecetedCategory] = useState(null);
  const [expandCategory, setExpandCategory] = useState(false);
  const [hubOwnerPfp, setHubOwnerPfp] = useState(null);
  const [hubBanner, setHubBanner] = useState(null);
  const [hubImage, setHubImage] = useState(null);

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

  const Section = ({ title, color }) => {
    return (
      <div className="explore-section">
        <div className="explore-section-header">
          <h3>{title} Hubs</h3>
          <span>See more &gt;&gt;</span>
        </div>

        <div className="explore-banner" style={{background: `${hubBanner ? color : '#333'}`}}>
          <div className="explore-banner-left">
            <div className='hub-info'>
              <div className='hub-owner-info'>
                {hubOwnerPfp ? <img className='hub-owner-pfp' src={hubOwnerPfp.src} alt=''></img> 
                  : 
                <img className='hub-owner-pfp' src='/profile-pic-undefined.gif' alt=''
                style={{objectFit: 'cover'}}></img>}
                <div className='hub-owner-info-display'>
                  <div className='hub-owner-display-name'>
                    <span>Owned by:</span>
                    <span>Owner Name</span>
                  </div>
                </div>
              </div>
              <h2>{title.toUpperCase()}</h2>
            </div>
            <button className='explore-visit-btn'>Visit Fanhub <span className='ico'>→</span></button>
          </div>

          <div className="explore-banner-right">
            {[1,2,3,4].map((i) => (
              hubImage ?
                <img key={i} src={`/assets/featured-${i}.jpg`} alt=''
                  onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "/WompWomp.png";
                }}/>
                :
                <SkeletonTheme key={i} baseColor="#d7d7d7" highlightColor="#ffffff">
                  <Skeleton />
                </SkeletonTheme>
            ))}
          </div>
        </div>
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
          {["Gaming", "Just Chatting", "Singing", "ASMR"].map((cat, i) => (
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
          <h3>⭐ Top {selecetedCategory} Hub</h3>
          <div className="explore-banner" style={{background: `${hubBanner ? color : '#999999'}`}}>
            <div className="explore-banner-left">
              <div className='hub-info'>
                <div className='hub-owner-info'>
                  {hubOwnerPfp ? <img className='hub-owner-pfp' src={hubOwnerPfp.src} alt=''></img> 
                    : 
                  <img className='hub-owner-pfp' src='/profile-pic-undefined.gif' alt=''
                  style={{objectFit: 'cover'}}></img>}
                  <div className='hub-owner-info-display'>
                    <div className='hub-owner-display-name'>
                      <span>Owned by:</span>
                      <span>WE ARE CHARLIE KIRK</span>
                    </div>
                  </div>
                </div>
                <h2>Hub Name</h2>
              </div>
              <button className='explore-visit-btn'>Visit Fanhub <span className='ico'>→</span></button>
            </div>

            <div className="explore-banner-right">
              {[1,2,3,4].map((i) => (
                hubBanner ?
                <img key={i} src={`/assets/featured-${i}.jpg`} alt=''
                  onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "/WompWomp.png";
                }}/>
                :
                <SkeletonTheme key={i} baseColor="#d7d7d7" highlightColor="#ffffff">
                  <Skeleton />
                </SkeletonTheme>
              ))}
            </div>
          </div>
        </div>

        <Section title="Gaming" color="gray" />
        <Section title="Singing" color="gold" />

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
