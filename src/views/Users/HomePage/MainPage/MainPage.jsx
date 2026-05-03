import './MainPage.css'
import { useSideBar } from '@/contexts/SideBarContext';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import FirstPageModuleBg from '../../../../assets/Decor/uma-musume-pretty-derby-zeno-rob-roy.png'
import FirstPageModuleBg2 from '../../../../assets/Decor/hand-drawn-hieroglyph.png'

import SecondPageModuleBg2 from '../../../../assets/Decor/Kobayashi-Newspaper.png'

import SecondPageModuleIco from '../../../../assets/UI-Elements/announce-svgrepo-com.svg'
import VirtualGremlin from '@/components/Gremlin_V-Pet/VirtualGremlin';
import { getUserById } from '@/services/UserController';
import { getAnnouncementsAndEvents } from '@/services/PostController';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';

export default function MainPage() {
  const { sideBarRetractor } = useSideBar();
  const router = useRouter();
  const [hoveredCard, setHoveredCard] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);
  const [time, setTime] = useState(new Date());
  
  // News carousel states
  const [loggedInUserId, setLoggedInUserId] = useState(null);
  const [joinedHubs, setJoinedHubs] = useState([]);
  const [allAnnouncements, setAllAnnouncements] = useState([]);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [isCarouselPaused, setIsCarouselPaused] = useState(false);

  useEffect(() => {
    const storedUserId = sessionStorage.getItem("userID") || localStorage.getItem("userID");
    if (storedUserId) {
      setLoggedInUserId(parseInt(storedUserId, 10));
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Fetch joined hubs
  useEffect(() => {
    const fetchJoinedHubs = async () => {
      try {
        const userId = localStorage.getItem('userID') || sessionStorage.getItem('userID');
        if (!userId) return;

        const userData = await getUserById(userId);
        if (userData && userData.fanHubsJoined) {
          setJoinedHubs(userData.fanHubsJoined);
        }
      } catch (error) {
        console.error('Error fetching joined hubs:', error);
      }
    };

    fetchJoinedHubs();
  }, []);

  // Fetch announcements for all joined hubs
  useEffect(() => {
    const fetchAllAnnouncements = async () => {
      if (joinedHubs.length === 0) return;

      try {
        const promises = joinedHubs.map(hub =>
          getAnnouncementsAndEvents(hub.fanHubId, 0, 100, 'createdAt')
            .then(posts => posts.map(post => ({
              ...post,
              fanHubThemeColor: hub.themeColor,
              fanHubAvatarUrl: hub.avatarUrl,
              fanHubName: hub.fanHubName
            })))
        );

        const results = await Promise.all(promises);
        const flattened = results.flat();

        // Filter only non-expired announcements (endTime hasn't passed)
        const now = new Date();
        const validAnnouncements = flattened.filter(post => {
          if (!post.endTime) return true; // Include posts without endTime
          return new Date(post.endTime) > now;
        });

        // Sort by createdAt descending
        const sorted = validAnnouncements.sort((a, b) =>
          new Date(b.createdAt) - new Date(a.createdAt)
        );
        
        setAllAnnouncements(sorted);
        setCarouselIndex(0);
      } catch (error) {
        console.error('Error fetching announcements:', error);
      }
    };

    fetchAllAnnouncements();
  }, [joinedHubs]);

  useEffect(() => {
    if (allAnnouncements.length === 0 || isCarouselPaused) return;

    const scrollInterval = setInterval(() => {
      setCarouselIndex(prev => (prev + 1) % allAnnouncements.length);
    }, 5000);

    return () => clearInterval(scrollInterval);
  }, [allAnnouncements, isCarouselPaused]);

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

  // Format date range for announcements
  const formatDateRange = (startTime, endTime) => {
    if (!startTime && !endTime) return '';

    const formatDateOnly = (dateString) => {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, '0');
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = monthNames[date.getMonth()];
      return `${day} ${month}`;
    };

    if (startTime && endTime) {
      return `${formatDateOnly(startTime)} - ${formatDateOnly(endTime)}`;
    } else if (startTime) {
      return `Starting ${formatDateOnly(startTime)}`;
    } else if (endTime) {
      return `Until ${formatDateOnly(endTime)}`;
    }
    return '';
  };

  // Navigate carousel
  const handlePrevSlide = () => {
    setCarouselIndex(prev => (prev === 0 ? allAnnouncements.length - 1 : prev - 1));
  };

  const handleNextSlide = () => {
    setCarouselIndex(prev => (prev + 1) % allAnnouncements.length);
  };

  // Handle news post click
  const handlePostClick = (post) => {
    router.push(`/news-feed/${post.fanHubId}/${post.postId}`);
  };

  // Prevent carousel controls from triggering card selection
  const handleCarouselControlClick = (e, handler) => {
    e.stopPropagation();
    handler();
  };

  // Get pinned announcements for agenda
  const getPinnedAgendaItems = () => {
    const now = new Date();
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    return allAnnouncements.filter(post => {
      if (!post.isPinned) return false;
      if (!post.startTime && !post.endTime) return false;

      // Don't show if expired more than a month ago
      if (post.endTime) {
        const endTime = new Date(post.endTime);
        if (endTime < oneMonthAgo) return false;
      }

      return true;
    });
  };

  // Check if announcement is expired
  const isExpired = (endTime) => {
    if (!endTime) return false;
    return new Date(endTime) < new Date();
  };

  // Format date for agenda display
  const formatAgendaDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

  const pageModules = [
    { id: 1, title: 'Agenda', textColor: '#000', color: '#FFF', gridColumn: '1 / 3', gridRow: '1 / 3', backgroundList: [FirstPageModuleBg, FirstPageModuleBg2]},
    { id: 2, title: 'News', textColor: '#FFF', color: '#E8B84D', gridColumn: '3 / 7', gridRow: '1', backgroundList: [SecondPageModuleBg2] },
    { id: 3, title: 'Workshop', textColor: '#FFF', color: '#7CB342', gridColumn: '3 / 5', gridRow: '2' },
    { id: 4, title: 'My Collections', textColor: '#FFF', color: '#9E9E9E', gridColumn: '5 / 7', gridRow: '2' }
  ];

  return (
    <div className={`page-main-content ${!sideBarRetractor ? 'sidebar-retracted' : 'sidebar-expanded'}`}>
      {/* Random ahh blobs, dunno just though they looked cool */}
      <div className="blob"></div>
      <div className="blob-c">
      <div className="shape-blob"></div>
      <div className="shape-blob one"></div>
      <div className="shape-blob two"></div>
      <div className="shape-blob three"></div>
        <div className="shape-blob four"></div>
        <div className="shape-blob five"></div>
        <div className="shape-blob six"></div>
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
                      {/* Agenda only shows in focused mode */}
                      <div className='agenda-wrapper'>
                        {getPinnedAgendaItems().length > 0 ? (
                          <div className='agenda-list'>
                            {getPinnedAgendaItems().map((agenda) => (
                              <div key={agenda.postId} className='agenda-item'>
                                <div className='agenda-title-section'>
                                  <h5 className='agenda-title'>{agenda.title}</h5>
                                  {isExpired(agenda.endTime) && (
                                    <span className='agenda-expired-badge'>Expired</span>
                                  )}
                                </div>
                                <div className='agenda-date-section'>
                                  <span className='agenda-date-label'>
                                    {formatAgendaDate(agenda.startTime)} - {formatAgendaDate(agenda.endTime)}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          loggedInUserId ?  
                          (<div className='agenda-empty-state'>
                            <p>No upcoming schedules</p>
                          </div>) : (
                          <div className='agenda-empty-state'>
                            <p>Need to be logged in to track agenda.</p>
                          </div>
                          )
                        )}
                      </div>
                    </div>
                  }
                  {pageModule.id === 2 && 
                    <div className='news-carousel-container'
                      onMouseEnter={() => setIsCarouselPaused(true)}
                      onMouseLeave={() => setIsCarouselPaused(false)}
                    >
                      {allAnnouncements.length > 0 ? (
                        <>
                          {/* Carousel View - Normal Mode */}
                          <div className='news-carousel-wrapper'>
                            <div className='news-carousel-card'>
                              <div className='carousel-media-container'>
                                {allAnnouncements[carouselIndex].mediaUrls && allAnnouncements[carouselIndex].mediaUrls.length > 0 ? (
                                  <div className='media-wrapper'>
                                    {allAnnouncements[carouselIndex].postType === 'VIDEO' ? (
                                      <video className='carousel-media' controls>
                                        <source src={allAnnouncements[carouselIndex].mediaUrls[0]} type='video/mp4' />
                                      </video>
                                    ) : (
                                      <img
                                        src={allAnnouncements[carouselIndex].mediaUrls[0]}
                                        alt={allAnnouncements[carouselIndex].title}
                                        className='carousel-media'
                                      />
                                    )}
                                  </div>
                                ) : (
                                  <div className='media-placeholder'>No Media</div>
                                )}
                              </div>

                              <div className='carousel-content-container'>
                                <h4 className='carousel-news-title'>{allAnnouncements[carouselIndex].title}</h4>
                                <p className='carousel-news-content'>
                                  {allAnnouncements[carouselIndex].content}
                                </p>
                              </div>
                            </div>

                            {/* Carousel Controls */}
                            {allAnnouncements.length > 1 && (
                              <>
                                <button className='carousel-control prev' onClick={(e) => handleCarouselControlClick(e, handlePrevSlide)}>
                                  <ChevronLeft />
                                </button>
                                <button className='carousel-control next' onClick={(e) => handleCarouselControlClick(e, handleNextSlide)}>
                                  <ChevronRight />
                                </button>
                                <div className='carousel-indicators'>
                                  {allAnnouncements.map((_, idx) => (
                                    <div
                                      key={idx}
                                      className={`indicator ${idx === carouselIndex ? 'active' : ''}`}
                                      onClick={(e) => {e.stopPropagation(); setCarouselIndex(idx);}}
                                    />
                                  ))}
                                </div>
                              </>
                            )}
                          </div>

                          {/* List View - Focused Mode */}
                          <div className='news-list-wrapper'>
                            <div className='news-list-container'>
                              {allAnnouncements.map((announcement) => (
                                <div key={announcement.postId} className='news-list-item'>
                                  <div className='list-item-media'>
                                    {announcement.mediaUrls && announcement.mediaUrls.length > 0 ? (
                                      announcement.postType === 'VIDEO' ? (
                                        <video className='list-media' controls>
                                          <source src={announcement.mediaUrls[0]} type='video/mp4' />
                                        </video>
                                      ) : (
                                        <img
                                          src={announcement.mediaUrls[0]}
                                          alt={announcement.title}
                                          className='list-media'
                                        />
                                      )
                                    ) : (
                                      <div className='list-media-placeholder'>No Media</div>
                                    )}
                                  </div>
                                  <div className='list-item-content'>
                                    <h5 className='list-news-title'>{announcement.title}</h5>
                                    {formatDateRange(announcement.startTime, announcement.endTime) && (
                                      <div className='list-date-range'>
                                        {formatDateRange(announcement.startTime, announcement.endTime)}
                                      </div>
                                    )}
                                    <p className='list-news-content'>{announcement.content}</p>
                                    <button 
                                      className='list-details-btn'
                                      onClick={() => handlePostClick(announcement)}
                                    >
                                      Details &gt;&gt;
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </>
                      ) : (
                        loggedInUserId ?  
                          (<div className='news-empty-state'>
                            <p>No announcements available</p>
                          </div>) : (
                          <div className='news-empty-state'>
                            <p>Need to be logged in to view announcements.</p>
                          </div>
                          )
                      )}
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
