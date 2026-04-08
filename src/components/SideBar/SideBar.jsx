'use client';

import { AddRounded, ArticleOutlined, BallotOutlined, ChairAltOutlined, DvrOutlined, Groups2, Groups2Outlined, KeyboardArrowUp, RecentActorsOutlined, School, SubjectOutlined } from '@mui/icons-material'
import HomeIco from '../../assets/UI-Elements/home.svg'
import ExploreIco from '../../assets/UI-Elements/search.svg'
import PostsIco from '../../assets/UI-Elements/post.svg'
import GachaIco from '../../assets/UI-Elements/gacha.svg'
import NewsIco from '../../assets/UI-Elements/news.svg'
import './SideBar.css'
import { useEffect, useState } from "react"
import { useRouter, usePathname } from 'next/navigation'
import { useSideBar } from '@/contexts/SideBarContext'

export default function SideBar() {
  const { sideBarSelected, setSideBarSelected, sideBarRetractor, setSideBarRetractor } = useSideBar();
  const [retract, setRetract] = useState(1);

  const router = useRouter();
  const pathname = usePathname();

  // Sync sidebar selection with current route
  useEffect(() => {
    const currentRoute = pathname === '/create-hub' ? 'create-hub' : pathname.replace('/', '') || 'home';
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
          <div className={`side-bar-button ${sideBarSelected === 'news' ? 'news' : ''}`} onClick={() => handleNavigation("news", "/news")}><img src={NewsIco.src} alt='' className="fas news-ico"/><span>News</span></div>
          <hr/>
          <div className={`side-bar-button ${sideBarSelected === 'create-hub' ? 'createHub' : ''}`} onClick={() => handleNavigation("create-hub", "/create-hub")}><AddRounded className="fas"/><span>Create A Hub</span></div>
          <div className={`side-bar-button ${sideBarSelected === 'gacha' ? 'gacha' : ''}`} onClick={() => handleNavigation("gacha", "/gacha")}><img src={GachaIco.src} alt='' className="fas"/><span>Gacha</span></div>
          <div className={`side-bar-button ${sideBarSelected === 'exam' ? 'exam' : ''}`} onClick={() => handleNavigation("exam", "/exam")}><School className="fas fa-exam"/><span>Exam List</span></div>
          <div className={`side-bar-button ${sideBarSelected === 'exam-room' ? 'exam-room' : ''}`} onClick={() => handleNavigation("exam-room", "/exam-room")}><ArticleOutlined className="fas fa-exam-room"/><span>Exam Room List</span></div>
          <hr/>
          <div className={`side-bar-button ${sideBarSelected === 'template' ? 'template' : ''}`} onClick={() => handleNavigation("template", "/template")}><DvrOutlined className="fas fa-template"/><span>Session Template</span></div>
          
          <div id="side-bar-content-highlight"></div>
        </div>
      </div>
    </>
  )
}
