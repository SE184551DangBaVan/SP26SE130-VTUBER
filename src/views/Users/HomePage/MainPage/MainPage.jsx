import './MainPage.css'
import { useSideBar } from '@/contexts/SideBarContext';
import { useState, useEffect } from 'react';

import FirstPageModuleBg from '../../../../assets/Decor/uma-musume-pretty-derby-zeno-rob-roy.png'
import FirstPageModuleBg2 from '../../../../assets/Decor/hand-drawn-hieroglyph.png'

import SecondPageModuleBg2 from '../../../../assets/Decor/Kobayashi-Newspaper.png'

import SecondPageModuleIco from '../../../../assets/UI-Elements/announce-svgrepo-com.svg'
import VirtualGremlin from '@/components/Gremlin_V-Pet/VirtualGremlin';

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
    { id: 1, title: 'Agenda', textColor: '#000', color: '#FFF', gridColumn: '1 / 3', gridRow: '1 / 3', backgroundList: [FirstPageModuleBg, FirstPageModuleBg2]},
    { id: 2, title: 'News', textColor: '#FFF', color: '#E8B84D', gridColumn: '3 / 7', gridRow: '1', backgroundList: [SecondPageModuleBg2] },
    { id: 3, title: 'Workshop', textColor: '#FFF', color: '#7CB342', gridColumn: '3 / 5', gridRow: '2' },
    { id: 4, title: 'My Collections', textColor: '#FFF', color: '#9E9E9E', gridColumn: '5 / 7', gridRow: '2' }
  ];

  return (
    <div className={`page-main-content ${!sideBarRetractor ? 'sidebar-retracted' : 'sidebar-expanded'}`}>
      {/* Random ahh blobs, dunno jus though they looked cool */}
      <div class="blob"></div>
      <div class="blob-c">
      <div class="shape-blob"></div>
      <div class="shape-blob one"></div>
      <div class="shape-blob two"></div>
      <div class="shape-blob three"></div>
        <div class="shape-blob four"></div>
        <div class="shape-blob five"></div>
        <div class="shape-blob six"></div>
      </div>
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
              {pageModule.backgroundList && 
              <div className={`page-module-background-${pageModule.id}`}>
                {pageModule.backgroundList[0] && <img className="page-module-background-first" src={pageModule.backgroundList[0].src}/>}
                {pageModule.backgroundList[1] && <img className="page-module-background-second" src={pageModule.backgroundList[1].src} />}
              </div>}
              <div className="page-module-content"
                style={{
                  color: pageModule.textColor
                }}
              >
                <h3 className='module-title'>{pageModule.title} {pageModule.id === 2 && <img className='news-speaker' src={SecondPageModuleIco.src}/>}</h3>
                <div className='module-main-content'>
                  {pageModule.id === 1 && 
                    <div className='agenda-schedule-container'>

                    </div>
                  }
                  {pageModule.id === 2 && 
                    <div className='news-carousel-container'>

                    </div>
                  }
                  {pageModule.id === 3 && 
                    <VirtualGremlin />
                  }
                  {pageModule.id === 4 && 
                    <p>Main content placeholder</p>
                  }
                </div>
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
