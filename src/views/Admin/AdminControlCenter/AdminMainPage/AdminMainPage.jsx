import { useState } from 'react';
import { DESKTOP_ICONS_CONFIG } from '../AdminDesktopConfig/desktopIconsConfig';
import './AdminMainPage.css';

export default function AdminMainPage() {
  const [showWindow, setShowWindow] = useState(false);
  const [activeWindowId, setActiveWindowId] = useState(null);

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
      <div className="desktop-container-loader">
        <div className='desktop-container-loader-watermark'>
          ⢀⣀⣀⠀ ⣀⣀⡀<br/>
          ⢸⣶⣹⠀ ⣷⢞⡅⠀⣤⡆⠀⠀⠀⠀⠀⠀⠀⠀  ⣿⡇<br/>
          ⢸⡳⢼⠀ ⡟⡾⡄⠿⣿⡿⠇  ⣿⡇⠀⣿⣿⠀⣿⡿⠛⢿⣧⠀ ⣼⣿⠛⢿⣿ ⣿⡿⠻⡟<br/>
          ⢸⡳⢾⣤ ⣷⣣⠇⠀⣿⡇⠀  ⣿⡇⠀⣽⣿⠀⣿⡇⠀ ⢸⣿⠀⣿⡿⠶⠾⠿ ⣿⡇⠀⠁<br/>
          ⠀⠙⢷⣚⣮⠟⠁⠀ ⠻⣷⡄   ⠿⣷⣤⣿⣿⠀⣿⣧⣤⣾⠟⠀ ⠻⣿⣤⣾⠿   ⣿⡇<br/>
        </div>
      </div>

      {/* Desktop Background */}
      <div className="desktop">
        {/* Render Desktop Icons from Config */}
        {DESKTOP_ICONS_CONFIG.map((iconConfig) => (
          <div 
            key={iconConfig.id}
            className="desktop-icon"
            onDoubleClick={() => handleDesktopIconClick(iconConfig.id)}
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
