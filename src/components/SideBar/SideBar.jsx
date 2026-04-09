'use client';

import { AddRounded, Groups, KeyboardArrowUp } from '@mui/icons-material'
import HomeIco from '../../assets/UI-Elements/home.svg'
import ExploreIco from '../../assets/UI-Elements/search.svg'
import PostsIco from '../../assets/UI-Elements/post.svg'
import GachaIco from '../../assets/UI-Elements/gacha.svg'
import NewsIco from '../../assets/UI-Elements/news.svg'
import './SideBar.css'
import JoinedHubsContainer from './JoinedHubsContainer'
import { useEffect, useState } from "react"
import { useRouter, usePathname } from 'next/navigation'
import { useSideBar } from '@/contexts/SideBarContext'
import { useAuth } from '@/functions/Auth/useAuth'
import { getMyHubAsOwner } from '@/services/FanHubController'

export default function SideBar() {
  const { sideBarSelected, setSideBarSelected, sideBarRetractor, setSideBarRetractor } = useSideBar();
  const { userAuth } = useAuth();
  const [retract, setRetract] = useState(1);
  const [vtuberHub, setVtuberHub] = useState(null);
  const [loadingVtuberHub, setLoadingVtuberHub] = useState(false);

  const router = useRouter();
  const pathname = usePathname();

  // Fetch VTuber's hub if user is a VTuber
  useEffect(() => {
    const fetchVtuberHub = async () => {
      if (userAuth?.role === 'VTUBER') {
        setLoadingVtuberHub(true);
        try {
          const hub = await getMyHubAsOwner();
          setVtuberHub(hub);
        } catch (error) {
          console.error('Error fetching VTuber hub:', error);
        } finally {
          setLoadingVtuberHub(false);
        }
      } else {
        setVtuberHub(null);
      }
    };

    fetchVtuberHub();
  }, [userAuth?.role]);

  // Sync sidebar selection with current route
  useEffect(() => {
    // Map routes to sidebar selection keys
    const routeToKeyMap = {
      '/': 'home',
      '/home': 'home',
      '/explore': 'explore',
      '/posts': 'posts',
      '/news-feed': 'news',
      '/create-hub': 'create-hub',
      '/gacha': 'gacha',
    };

    const currentRoute = routeToKeyMap[pathname] || pathname.replace('/', '') || 'home';
    if (sideBarSelected !== currentRoute) {
      setSideBarSelected(currentRoute);
    }
  }, [pathname]);

  const handleNavigation = (page, route) => {
    setSideBarSelected(page);
    setTimeout(() => {
      router.push(route);
    }, 200);
  };

  return (
    <>
      <div id="side-bar" className={ sideBarRetractor ? 'retract-animation' : 'rebound-animation'}>
        <input id="side-bar-toggle" type="checkbox" onClick={() => setSideBarRetractor(!sideBarRetractor)}/>
        <div id="side-bar-header">
          <label htmlFor="side-bar-toggle"><span id="side-bar-toggle-burger"></span></label>
        </div>
        <div id="side-bar-content">
          <div className={`side-bar-button ${sideBarSelected === 'home' ? 'home' : ''}`} onClick={() => handleNavigation("home", "/home")}><img src={HomeIco.src} alt='' className="fas"/><span>Home</span></div>
          <div className={`side-bar-button ${sideBarSelected === 'explore' ? 'explore' : ''}`} onClick={() => handleNavigation("explore", "/explore")}><img src={ExploreIco.src} alt='' className="fas"/><span>Explore</span></div>
          <div className={`side-bar-button ${sideBarSelected === 'posts' ? 'posts' : ''}`} onClick={() => handleNavigation("posts", "/posts")}><img src={PostsIco.src} alt='' className="fas"/><span>Posts</span></div>
          <div className={`side-bar-button ${sideBarSelected === 'news' ? 'news' : ''}`} onClick={() => handleNavigation("news", "/news-feed")}><img src={NewsIco.src} alt='' className="fas news-ico"/><span>News</span></div>
          <hr/>
          <JoinedHubsContainer />
          <hr/>
          {vtuberHub && (
            <div 
              className={`side-bar-button ${sideBarSelected === 'my-hub' ? 'myHub' : ''}`} 
              onClick={() => handleNavigation("my-hub", `/hub/${vtuberHub.subdomain}`)}
            >
              <Groups className="fas"/>
              <span>Go to your Hub</span>
            </div>
          )}
          {loadingVtuberHub && (
            <div className="side-bar-button" style={{ opacity: 0.5, cursor: 'default' }}>
              <Groups className="fas"/>
              <span>Loading...</span>
            </div>
          )}
          <div className={`side-bar-button ${sideBarSelected === 'create-hub' ? 'createHub' : ''}`} onClick={() => handleNavigation("create-hub", "/create-hub")}><AddRounded className="fas"/><span>Create A Hub</span></div>
          <div className={`side-bar-button ${sideBarSelected === 'gacha' ? 'gacha' : ''}`} onClick={() => handleNavigation("gacha", "/gacha")}><img src={GachaIco.src} alt='' className="fas"/><span>Gacha</span></div>

          <div id="side-bar-content-highlight"></div>
        </div>
      </div>
    </>
  )
}
