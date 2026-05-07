import './MainPage.css'
import { useSideBar } from '@/contexts/SideBarContext';
import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { EventCalendar } from '@mui/x-scheduler/event-calendar';

import FirstPageModuleBg from '@/assets/Decor/uma-musume-pretty-derby-zeno-rob-roy.png'
import FirstPageModuleBg2 from '@/assets/Decor/hand-drawn-hieroglyph.png'

import AbstractArtifact1 from '@/assets/Decor/futuristic-warning-sign-secure-area-frame-banner-decal-1-Photoroom.png'
import AbstractArtifact2 from '@/assets/Decor/futuristic-style-warning-signs-futuristic-inscriptions-and-technical-symbols-japanese-hieroglyphs-decals-2-Photoroom.png'
import AbstractArtifact3 from '@/assets/Decor/futuristic-style-warning-signs-futuristic-inscriptions-and-technical-symbols-japanese-hieroglyphs-decals-1.png'

import SecondPageModuleBg2 from '@/assets/Decor/Kobayashi-Newspaper.png'

import SecondPageModuleIco from '@/assets/UI-Elements/announce-svgrepo-com.svg'

import PetBGCanvas from '@/assets/Decor/Inventory.gif'

import NoMediaIco from '@/assets/UI-Elements/no-image.svg'
import NoNewsIco from '@/assets/UI-Elements/newspaper.svg'

import { getUserById, getUserByUsername } from '@/services/UserController';
import { getAnnouncementsAndEvents, getPostsFeed } from '@/services/PostController';
import { getBookmarkedPosts } from '@/services/BookedAgendaController';
import { getMyItems } from '@/services/ShopController';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';

function SystemTaskbar() {
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

  return (
    <div className="system-taskbar">
      <div className="taskbar-content">
        <div className="taskbar-time">{formatTime(time)}</div>
        <div className="taskbar-date">{formatDate(time)}</div>
      </div>
    </div>
  );
}

export default function MainPage() {
  const { sideBarRetractor } = useSideBar();
  const router = useRouter();
  const [hoveredCard, setHoveredCard] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);
  
  // News carousel states
  const [loggedInUserId, setLoggedInUserId] = useState(null);
  const [joinedHubs, setJoinedHubs] = useState([]);
  const [allAnnouncements, setAllAnnouncements] = useState([]);
  const [bookedAgendaPosts, setBookedAgendaPosts] = useState([]);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [isCarouselPaused, setIsCarouselPaused] = useState(false);
  const [myItems, setMyItems] = useState([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [itemsFetched, setItemsFetched] = useState(false);
  const [oshiProfile, setOshiProfile] = useState(null);
  const [oshiPosts, setOshiPosts] = useState([]);
  const [oshiProfileFetched, setOshiProfileFetched] = useState(false);
  const [oshiLoading, setOshiLoading] = useState(false);
  const [oshiFetched, setOshiFetched] = useState(false);
  const [oshiError, setOshiError] = useState('');

  const containerRef = useRef(null);

  useEffect(() => {
    const storedUserId = sessionStorage.getItem("userID") || localStorage.getItem("userID");
    if (storedUserId) {
      setLoggedInUserId(parseInt(storedUserId, 10));
    }
  }, []);

  // Fetch bookmarked posts
  useEffect(() => {
    const fetchBookedAgendaPosts = async () => {
      try {
        const booked = await getBookmarkedPosts(0, 100, 'createdAt', 'desc');
        setBookedAgendaPosts(booked);
      } catch (error) {
        console.error('Error fetching booked agenda posts:', error);
      }
    };

    fetchBookedAgendaPosts();
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

  useEffect(() => {
    if (selectedCard !== 3 || itemsFetched) return;

    let cancelled = false;

    const fetchMyItems = async () => {
      setItemsLoading(true);
      try {
        const items = await getMyItems();
        if (!cancelled) {
          setMyItems([...items].sort((a, b) => new Date(b.obtainedAt || 0) - new Date(a.obtainedAt || 0)));
          setItemsFetched(true);
        }
      } catch (error) {
        console.error('Error fetching user items:', error);
        if (!cancelled) {
          setMyItems([]);
          setItemsFetched(true);
        }
      } finally {
        if (!cancelled) {
          setItemsLoading(false);
        }
      }
    };

    fetchMyItems();

    return () => {
      cancelled = true;
    };
  }, [selectedCard, itemsFetched]);

  const fetchCurrentUserOshi = async () => {
    const storedUsername = sessionStorage.getItem('username') || localStorage.getItem('username');
    const storedUserId = sessionStorage.getItem('userID') || localStorage.getItem('userID');
    const fallbackUserId = loggedInUserId || (storedUserId ? parseInt(storedUserId, 10) : null);
    let currentUser = storedUsername ? await getUserByUsername(storedUsername) : null;

    if (!currentUser && fallbackUserId) {
      currentUser = await getUserById(fallbackUserId);
    }

    return { currentUser, fallbackUserId, oshiSeed: currentUser?.oshi };
  };

  useEffect(() => {
    if (oshiProfileFetched) return;

    let cancelled = false;

    const fetchOshiProfile = async () => {
      setOshiLoading(true);
      setOshiError('');

      try {
        const { fallbackUserId, oshiSeed } = await fetchCurrentUserOshi();
        if (!oshiSeed?.username || !oshiSeed?.userId) {
          if (!cancelled) {
            setOshiProfile(null);
            setOshiError(fallbackUserId ? 'No favourite Oshi selected yet.' : 'Log in to see your favourite Oshi.');
            setOshiProfileFetched(true);
          }
          return;
        }

        const oshiDetails = await getUserByUsername(oshiSeed.username);

        if (!cancelled) {
          const resolvedOshi = oshiDetails || oshiSeed;
          setOshiProfile(resolvedOshi);
          setOshiProfileFetched(true);
        }
      } catch (error) {
        console.error('Error fetching Oshi profile:', error);
        if (!cancelled) {
          setOshiProfile(null);
          setOshiError('Unable to load Oshi right now.');
          setOshiProfileFetched(true);
        }
      } finally {
        if (!cancelled) {
          setOshiLoading(false);
        }
      }
    };

    fetchOshiProfile();

    return () => {
      cancelled = true;
    };
  }, [oshiProfileFetched, loggedInUserId]);

  useEffect(() => {
    if (selectedCard !== 4 || oshiFetched || !oshiProfile?.userId) return;

    let cancelled = false;

    const fetchOshiActivity = async () => {
      setOshiLoading(true);

      try {
        const feedPosts = await getPostsFeed(0, 50, 'createdAt', 'desc');

        if (!cancelled) {
          setOshiPosts(feedPosts.filter(post => Number(post.authorId) === Number(oshiProfile.userId)));
          setOshiFetched(true);
        }
      } catch (error) {
        console.error('Error fetching Oshi activity:', error);
        if (!cancelled) {
          setOshiPosts([]);
          setOshiError('Unable to load Oshi activity right now.');
          setOshiFetched(true);
        }
      } finally {
        if (!cancelled) {
          setOshiLoading(false);
        }
      }
    };

    fetchOshiActivity();

    return () => {
      cancelled = true;
    };
  }, [selectedCard, oshiFetched, oshiProfile?.userId]);

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

  const handleModuleClick = (event, moduleId) => {
    event.stopPropagation();
    setHoveredCard(moduleId);
    setSelectedCard(moduleId);
  };

  const handlePageClick = (event) => {
    if (!selectedCard) return;
    if (event.target.closest('.page-module')) return;

    setHoveredCard(null);
    setSelectedCard(null);
  };

  // Get booked announcements for agenda
  const getBookedAgendaItems = () => {
    const now = new Date();
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    return bookedAgendaPosts.filter(post => {
      if (!post.startTime && !post.endTime) return false;

      // Don't show if expired more than a month ago
      if (post.endTime) {
        const endTime = new Date(post.endTime);
        if (endTime < oneMonthAgo) return false;
      }

      return true;
    });
  };

  const pinnedAgendaItems = useMemo(() => getBookedAgendaItems(), [bookedAgendaPosts]);

  const agendaResources = useMemo(() => {
    const eventColors = ['blue', 'green', 'purple', 'orange', 'pink', 'teal', 'amber', 'indigo'];
    const uniqueHubs = [];

    pinnedAgendaItems.forEach((agenda) => {
      if (!uniqueHubs.some(hub => hub.id === String(agenda.fanHubId))) {
        uniqueHubs.push({
          id: String(agenda.fanHubId),
          title: agenda.fanHubName || 'FanHub',
          eventColor: eventColors[uniqueHubs.length % eventColors.length]
        });
      }
    });

    return uniqueHubs;
  }, [pinnedAgendaItems]);

  const agendaEvents = useMemo(() => {
    return pinnedAgendaItems
      .map((agenda) => {
        const start = new Date(agenda.startTime || agenda.endTime);
        const end = new Date(agenda.endTime || start.getTime() + 60 * 60 * 1000);

        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
        if (end <= start) end.setHours(start.getHours() + 1);

        return {
          id: agenda.postId,
          title: agenda.title,
          start: start.toISOString(),
          end: end.toISOString(),
          resource: String(agenda.fanHubId),
          readOnly: true
        };
      })
      .filter(Boolean);
  }, [pinnedAgendaItems]);

  const agendaDefaultVisibleDate = useMemo(() => {
    const now = new Date();
    const upcomingEvent = agendaEvents
      .map(event => new Date(event.start))
      .filter(date => date >= now)
      .sort((a, b) => a - b)[0];

    return upcomingEvent || now;
  }, [agendaEvents]);

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

  const formatActivityDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const pageModules = [
    { id: 1, title: 'Agenda', textColor: '#000', color: '#FFF', gridColumn: '1 / 3', gridRow: '1 / 3', backgroundList: [FirstPageModuleBg, FirstPageModuleBg2, AbstractArtifact2]},
    { id: 2, title: 'News', textColor: '#FFF', color: '#efefef', gridColumn: '3 / 7', gridRow: '1' },
    { id: 3, title: 'I nventory', textColor: '#FFF', color: '#7CB342', gridColumn: '3 / 5', gridRow: '2', backgroundList: [AbstractArtifact1], backgroundImg: PetBGCanvas },
    { id: 4, title: 'My Favourite Oshi', textColor: '#FFF', color: '#9E9E9E', gridColumn: '5 / 7', gridRow: '2' }
  ];

  return (
    <div
      className={`page-main-content ${!sideBarRetractor ? 'sidebar-retracted' : 'sidebar-expanded'}`}
      onClick={handlePageClick}
    >
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
              className={`page-module pm-${selectedCard === pageModule.id && pageModule.id} ${(selectedCard || hoveredCard) === pageModule.id ? 'focused' : ''} ${(selectedCard || hoveredCard) && (selectedCard || hoveredCard) !== pageModule.id ? 'shrunk' : ''}`}
              onMouseEnter={() => {
                if (!selectedCard) setHoveredCard(pageModule.id);
              }}
              onMouseLeave={() => {
                if (!selectedCard) setHoveredCard(null);
              }}
              onClick={(event) => handleModuleClick(event, pageModule.id)}
              style={{ 
                backgroundColor: pageModule.color,
                gridColumn: pageModule.gridColumn,
                gridRow: pageModule.gridRow,
                backgroundImage: `url(${pageModule.backgroundImg?.src})`,
                backgroundSize: pageModule.backgroundImg && 'cover',
                backgroundPosition: pageModule.backgroundImg && 'center'
              }}
            >
              {pageModule.backgroundList && 
              <div className={`page-module-background-${pageModule.id}`}>
                {pageModule.backgroundList[0] && <img className="page-module-background-first" src={pageModule.backgroundList[0].src}/>}
                {pageModule.backgroundList[1] && <img className="page-module-background-second" src={pageModule.backgroundList[1].src} />}
                {pageModule.backgroundList[2] && <img className="page-module-background-third" src={pageModule.backgroundList[2].src} />}
              </div>}
              <div className="page-module-content"
                style={{
                  color: pageModule.textColor
                }}
              >
                <h3 className='module-title'>{pageModule.title} {pageModule.id === 2 && <img className='news-speaker' src={SecondPageModuleIco.src}/>}</h3>
                <div className='module-main-content' ref={containerRef} >
                  {pageModule.id === 1 && selectedCard === pageModule.id &&
                    <div className='agenda-schedule-container'>
                      {/* Agenda only shows in focused mode */}
                      <div className='agenda-wrapper'>
                        {agendaEvents.length > 0 ? (
                          <div className='agenda-calendar-shell'>
                            <EventCalendar
                              events={agendaEvents}
                              resources={agendaResources}
                              views={['week', 'month']}
                              defaultView='week'
                              defaultVisibleDate={agendaDefaultVisibleDate}
                              showCurrentTimeIndicator
                              readOnly
                              areEventsDraggable={false}
                              areEventsResizable={false}
                              defaultPreferences={{
                                ampm: false,
                                isSidePanelOpen: false,
                                showWeekends: true,
                                showWeekNumber: false
                              }}
                            />
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
                                      <video className='carousel-media' autoPlay controls={isCarouselPaused} muted loop>
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
                                  <div className='media-placeholder'><img className='no-media-placeholer' src={NoMediaIco.src} alt='No Media'/></div>
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
                            <img className='no-news-available' src={NoNewsIco.src} />
                            <p>Join Fan Hubs to see News about your favourite creator.</p>
                          </div>) : (
                          <div className='news-empty-state'>
                            <img className='no-news-available' src={NoNewsIco.src} />
                            <p>You need to be logged in to receive News delegated to your interests</p>
                          </div>
                          )
                      )}
                    </div>
                  }
                  {pageModule.id === 3 && selectedCard === pageModule.id &&
                    <div className='inventory-module-panel'>
                      {itemsLoading ? (
                        <div className='module-loading-state'>Loading inventory...</div>
                      ) : myItems.length > 0 ? (
                        <div className='inventory-items-grid'>
                          {myItems.map((item) => (
                            <div key={item.userItemId || item.itemId} className='inventory-item-card'>
                              <h4 className='inventory-item-name'>{item.itemName}</h4>
                              <div className='inventory-item-image-shell'>
                                <img
                                  className='inventory-item-image'
                                  src={item.imageUrl || NoMediaIco.src}
                                  alt={item.itemName}
                                  onError={(event) => {
                                    event.currentTarget.src = NoMediaIco.src;
                                  }}
                                />
                              </div>
                              <p className='inventory-item-category'>Category: {item.category}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className='module-empty-state'>No items in your inventory yet.</div>
                      )}
                    </div>
                  }
                  {pageModule.id === 4 &&
                    <div className={`oshi-module-panel ${selectedCard === pageModule.id ? 'selected' : 'preview'}`}>
                      {oshiLoading && !oshiProfile ? (
                        <div className='module-loading-state'>Loading Oshi activity...</div>
                      ) : oshiProfile ? (
                        <>
                          <div className='oshi-profile-card'>
                            <div className='oshi-avatar-shell'>
                              <img
                                className='oshi-avatar'
                                src={oshiProfile.avatarUrl || NoMediaIco.src}
                                alt={oshiProfile.displayName || oshiProfile.username}
                                onError={(event) => {
                                  event.currentTarget.src = NoMediaIco.src;
                                }}
                              />
                            </div>
                            <div className='oshi-profile-copy'>
                              <h4>{oshiProfile.displayName || oshiProfile.username}</h4>
                              <p>@{oshiProfile.username}</p>
                            </div>
                          </div>

                          {selectedCard === pageModule.id && (
                            <div className='oshi-posts-section'>
                              {oshiLoading && !oshiFetched ? (
                                <div className='module-loading-state'>Loading Oshi activity...</div>
                              ) : oshiPosts.length > 0 ? (
                                oshiPosts.map((post) => (
                                  <button
                                    key={post.postId}
                                    type='button'
                                    className='oshi-post-card'
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      handlePostClick(post);
                                    }}
                                  >
                                    <div className='oshi-post-media-shell'>
                                      {post.mediaUrls?.length > 0 ? (
                                        post.postType === 'VIDEO' ? (
                                          <video className='oshi-post-media' muted>
                                            <source src={post.mediaUrls[0]} type='video/mp4' />
                                          </video>
                                        ) : (
                                          <img
                                            className='oshi-post-media'
                                            src={post.mediaUrls[0]}
                                            alt={post.title}
                                          />
                                        )
                                      ) : (
                                        <img className='oshi-post-placeholder' src={NoMediaIco.src} alt='No media' />
                                      )}
                                    </div>
                                    <div className='oshi-post-copy'>
                                      <span className='oshi-post-hub'>{post.fanHubName || 'FanHub'}</span>
                                      <h5>{post.title}</h5>
                                      <p>{post.content}</p>
                                      <span className='oshi-post-date'>{formatActivityDate(post.createdAt)}</span>
                                    </div>
                                  </button>
                                ))
                              ) : (
                                <div className='module-empty-state'>No recent posts found for this Oshi.</div>
                              )}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className='module-empty-state'>{oshiError || 'No favourite Oshi selected yet.'}</div>
                      )}
                    </div>
                  }
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <SystemTaskbar />
    </div>
  )
}
