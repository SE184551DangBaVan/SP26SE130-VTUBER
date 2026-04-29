import './MainPage.css'
import { useSideBar } from '@/contexts/SideBarContext';
import { useState, useEffect } from 'react';

export default function MainPage() {
  const { sideBarRetractor } = useSideBar();
  const [hoveredCard, setHoveredCard] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date) => {
    const hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes} ${ampm}`;
  };

  const formatDate = (date) => {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  const pageModules = [
    { id: 1, title: 'Card 1', color: '#C94C4C', gridColumn: '1 / 3', gridRow: '1 / 3' },
    { id: 2, title: 'Card 2', color: '#E8B84D', gridColumn: '3 / 7', gridRow: '1' },
    { id: 3, title: 'Card 3', color: '#7CB342', gridColumn: '3 / 5', gridRow: '2' },
    { id: 4, title: 'My Items', color: '#9E9E9E', gridColumn: '5 / 7', gridRow: '2' }
  ];

  return (
    <div className={`page-main-content ${!sideBarRetractor ? 'sidebar-retracted' : 'sidebar-expanded'}`}>
      <div className="page-modules-grid-container">
        <div className="page-modules-grid">
          {pageModules.map((pageModule) => (
            <div
            id={pageModule.id}
              key={pageModule.id}
              className={`page-module pm-${selectedCard === pageModule.id && pageModule.id} ${hoveredCard === pageModule.id ? 'focused' : ''} ${hoveredCard && hoveredCard !== pageModule.id ? 'shrunk' : ''}`}
              onMouseEnter={() => setHoveredCard(pageModule.id)}
              onMouseLeave={() => {setHoveredCard(null); setSelectedCard(null);}}
              onClick={() => setSelectedCard(pageModule.id)}
              style={{ 
                backgroundColor: pageModule.color,
                gridColumn: pageModule.gridColumn,
                gridRow: pageModule.gridRow
              }}
            >
              <div className="page-module-content">
                <h3>{pageModule.title}</h3>
                <p>Image placeholder</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* System Taskbar with Clock */}
      <div className="system-taskbar">
        <div className="taskbar-content">
          <div className="taskbar-time">{formatTime(time)}</div>
          <div className="taskbar-date">{formatDate(time)}</div>
        </div>
      </div>
    </div>
  )
}
