import { useEffect, useRef, useState } from 'react';
import { DESKTOP_ICONS_CONFIG } from '../AdminDesktopConfig/desktopIconsConfig';
import './AdminMainPage.css';

import AdminIco from '../../../../assets/UI-Elements/admin-logo.svg';

export default function AdminMainPage() {
  const [showWindow, setShowWindow] = useState(false);
  const [activeWindowId, setActiveWindowId] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = 0.02;
      audioRef.current.play().catch(() => {});
    }
  }, []);

  const toggleMute = () => {
    if (audioRef.current) {
      const newMutedState = !isMuted;
      audioRef.current.muted = newMutedState;
      setIsMuted(newMutedState);
    }
  };

  const handleDesktopIconClick = (iconId) => {
    setActiveWindowId(iconId);
    setShowWindow(true);
  };

  const handleCloseWindow = () => {
    setShowWindow(false);
    setActiveWindowId(null);
  };

  const getActiveWindowConfig = () => {
    return DESKTOP_ICONS_CONFIG.find(icon => icon.id === activeWindowId);
  };

  const ActiveContent = getActiveWindowConfig()?.component;

  return (
    <div className="desktop-container">
      <audio ref={audioRef} src="/sfx/Safety_First-Home_Safety_Hotline_OST-David_Johnsen-VHS.mp3" loop />
      
      {/* Top Right Controls */}
      <div className="desktop-top-controls">
        <button className="mute-toggle-btn" onClick={toggleMute} title={isMuted ? "Unmute" : "Mute"}>
          {isMuted ? "🔇" : "🔊"}
        </button>
      </div>

      <div className="desktop-container-loader">
        <img className='admin-logo' src={AdminIco.src} />
        <div className='desktop-container-loader-watermark'>
          FANHUB ADMIN
        </div>
      </div>

      {/* Desktop Background */}
      <div className="desktop">
        {/* Render Desktop Icons from Config */}
        {DESKTOP_ICONS_CONFIG.map((iconConfig) => (
          <div 
            key={iconConfig.id}
            className="desktop-icon"
            onClick={() => handleDesktopIconClick(iconConfig.id)}
          >
            <div className="icon-image">{iconConfig.icon}</div>
            <div className="icon-label">{iconConfig.label}</div>
          </div>
        ))}

        {/* General Window Container for All Contents */}
        {showWindow && ActiveContent && (
          <div className="window-container">
            <div className="window">
              {/* Window Header */}
              <div className="window-header">
                <span>{getActiveWindowConfig()?.windowTitle}</span>
                <div className="window-controls">
                  <button onClick={handleCloseWindow}>—</button>
                  <button onClick={handleCloseWindow}>✕</button>
                </div>
              </div>

              {/* Window Body - Generic Container */}
              <div className="window-body">
                <ActiveContent />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
