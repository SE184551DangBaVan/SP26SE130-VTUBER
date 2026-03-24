import { useState } from 'react';
import './ExplorePage.css'

export default function ExplorePage() {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [selecetedCategory, setSelecetedCategory] = useState(null);

  const CommunityCard = () => {
    return (
      <div className="community-card">
        <p className="community-label">
          Since you are a member of <b>Forsaken Pebbles</b>,
        </p>

        <div className="banner red">
          <div className="banner-left">
            <h2>CALAMITAS' HEARTH</h2>
            <button>Visit Fanhub →</button>
          </div>

          <div className="banner-right">
            {[1,2,3,4].map((i) => (
              <img key={i} src={`/assets/community-${i}.jpg`} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  const Section = ({ title, color }) => {
    return (
      <div className="section">
        <div className="section-header">
          <h3>{title}</h3>
          <span>See more of {title} &gt;&gt;</span>
        </div>

        <div className={`banner ${color}`}>
          <div className="banner-left">
            <h2>{title.toUpperCase()} FEATURE</h2>
            <button>Visit Fanhub →</button>
          </div>

          <div className="banner-right">
            {[1,2,3,4].map((i) => (
              <img key={i} src={`/assets/${title}-${i}.jpg`} />
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
            <button className='see-more-category-btn'>See More <span>{">>"}</span></button>
          </div>
        </div>
        <div className="category-row">
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
            />
            <span>{cat}</span>
          </div>
        ))}
        </div>

        <div className="section">
          <h3>⭐ Top {selecetedCategory} Hubs</h3>
          <div className="banner">
            <div className="banner-left">
              <div className='hub-info'>
                <div className='hub-owner-info'>
                  <img className='hub-owner-pfp' src='' alt=''></img>
                  <div className='hub-owner-info-display'>
                    <div className='hub-owner-display-name'>Owned by:<span></span></div>
                  </div>
                </div>
                <h2>Hub Name</h2>
              </div>
              <button>Visit Fanhub →</button>
            </div>

            <div className="banner-right">
              {[1,2,3,4].map((i) => (
                <img key={i} src={`/assets/featured-${i}.jpg`} />
              ))}
            </div>
          </div>
        </div>

        <Section title="Gaming" color="red" />
        <Section title="Singing" color="mint" />

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
