'use client';

import { AddRounded, Groups, KeyboardArrowUp } from '@mui/icons-material'
import HomeIco from '../../assets/UI-Elements/home.svg'
import ExploreIco from '../../assets/UI-Elements/search.svg'
import PostsIco from '../../assets/UI-Elements/post.svg'
import GachaIco from '../../assets/UI-Elements/gacha.svg'
import NewsIco from '../../assets/UI-Elements/news.svg'
import HubIco from '../../assets/UI-Elements/my-hub-center.svg'
import ShopIco from '../../assets/UI-Elements/shop.svg'
import FeedbackIco from '../../assets/UI-Elements/feedback-submit.svg'
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

  useEffect(() => {
    const routeToKeyMap = {
      '/': 'home',
      '/home': 'home',
      '/explore': 'explore',
      '/posts': 'posts',
      '/news-feed': 'news',
      '/create-hub': 'create-hub',
      '/gacha': 'gacha',
      '/shop': 'shop',
      '/feedback': 'feedback',
    };

    // Check if current route matches VTuber hub
    const isVtuberHubRoute = vtuberHub && pathname === `/hub/${vtuberHub.subdomain}`;
    const currentRoute = isVtuberHubRoute ? 'my-hub' : (routeToKeyMap[pathname] || pathname.replace('/', '') || 'home');
    
    if (sideBarSelected !== currentRoute) {
      setSideBarSelected(currentRoute);
    }
  }, [pathname, vtuberHub]);

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
        <div id='side-bar-content' className={`${userAuth?.role === 'VTUBER' && 'has-hub-management'}`}>
          <div className={`side-bar-button ${sideBarSelected === 'home' ? 'home' : ''}`} onClick={() => handleNavigation("home", "/home")}><img src={HomeIco.src} alt='' className="fas"/><span>Home</span></div>
          <div className={`side-bar-button ${sideBarSelected === 'explore' ? 'explore' : ''}`} onClick={() => handleNavigation("explore", "/explore")}><img src={ExploreIco.src} alt='' className="fas"/><span>Explore</span></div>
          <div className={`side-bar-button ${sideBarSelected === 'posts' ? 'posts' : ''}`} onClick={() => handleNavigation("posts", "/posts")}><img src={PostsIco.src} alt='' className="fas"/><span>Posts</span></div>
          <div className={`side-bar-button ${sideBarSelected === 'news' ? 'news' : ''}`} onClick={() => handleNavigation("news", "/news-feed")}><img src={NewsIco.src} alt='' className="fas news-ico"/><span>News</span></div>
          {userAuth?.role === 'VTUBER' && (
            <>
              {vtuberHub && !loadingVtuberHub &&  (
                <div 
                  className={`side-bar-button ${sideBarSelected === 'my-hub' ? 'myHub' : ''}`} 
                  onClick={() => handleNavigation("my-hub", `/hub/${vtuberHub.subdomain}`)}
                >
                  <img src={HubIco.src} alt='' className="fas"/>
                  <span>Go to your Hub</span>
                </div>
              )}
              {!vtuberHub && !loadingVtuberHub &&  (
                <div className={`side-bar-button ${sideBarSelected === 'create-hub' ? 'createHub' : ''}`} onClick={() => handleNavigation("create-hub", "/create-hub")}><AddRounded className="fas"/><span>Create A Hub</span></div>
              )}
              {loadingVtuberHub && (
                <div className="side-bar-button" style={{ opacity: 0.5, cursor: 'default' }}>
                  <span>Loading...</span>
                </div>
              )}
            </>
          )}
          <hr/>
          <JoinedHubsContainer />
          <hr/>
          <div className={`side-bar-button ${sideBarSelected === 'gacha' ? 'gacha' : ''}`} onClick={() => handleNavigation("gacha", "/gacha")}><img src={GachaIco.src} alt='' className="fas"/><span>Gacha</span></div>
          <div className={`side-bar-button ${sideBarSelected === 'shop' ? 'shop' : ''}`} onClick={() => handleNavigation("shop", "/shop")}><img src={ShopIco.src} alt='' className="fas"/><span>Shop</span></div>
          <div className={`side-bar-button ${sideBarSelected === 'feedback' ? 'feedback' : ''}`} onClick={() => handleNavigation("feedback", "/feedback")}><img src={FeedbackIco.src} alt='' className="fas"/><span>Feedback</span></div>
          <div id="side-bar-content-highlight"></div>
        </div>
      </div>
    </>
  )
}
