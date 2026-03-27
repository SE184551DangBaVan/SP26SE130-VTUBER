'use client';

import { ArticleOutlined, BallotOutlined, ChairAltOutlined, DvrOutlined, Groups2, Groups2Outlined, KeyboardArrowUp, RecentActorsOutlined, School, SubjectOutlined } from '@mui/icons-material'
import HomeIco from '../../assets/UI-Elements/home.svg'
import ExploreIco from '../../assets/UI-Elements/search.svg'
import PostsIco from '../../assets/UI-Elements/post.svg'
import './SideBar.css'
import ScissorLift from '../../components/ExtensionJoint/ScissorLift'
import { useEffect, useState } from "react"
import axios from 'axios';
import { useRouter } from 'next/navigation'

export default function SideBar({displayName}) {
  const [sideBarSelected, setSideBarSelected] = useState("home");
  const [retract, setRetract] = useState(1);
  const [sideBarRetractor, setSideBarRetractor] = useState(true);
  const router = useRouter();

  return (
    <>
      <div id="side-bar" className={ sideBarRetractor ? 'retract-animation' : 'rebound-animation'}>
        <input id="side-bar-toggle" type="checkbox" onClick={() => setSideBarRetractor(!sideBarRetractor)}/>
        <div id="side-bar-header">
          <label htmlFor="side-bar-toggle"><span id="side-bar-toggle-burger"></span></label>
        </div>
        <div id="side-bar-content">
          <div className={`side-bar-button ${sideBarSelected === 'home' ? 'home' : ''}`} onClick={() => {setSideBarSelected("home"); router.push("/home");}}><img src={HomeIco.src} alt='' className="fas"/><span>Home</span></div>
          <div className={`side-bar-button ${sideBarSelected === 'explore' ? 'explore' : ''}`} onClick={() => {setSideBarSelected("explore"); router.push("/explore");}}><img src={ExploreIco.src} alt='' className="fas"/><span>Explore</span></div>
          <div className={`side-bar-button ${sideBarSelected === 'posts' ? 'posts' : ''}`} onClick={() => {setSideBarSelected("posts"); router.push("/posts");}}><img src={PostsIco.src} alt='' className="fas"/><span>Posts</span></div>
          <hr/>
          <div className={`side-bar-button ${sideBarSelected === 'room' ? 'room' : ''}`} onClick={() => setSideBarSelected("room")}><ChairAltOutlined className="fas fa-room"/><span>Gacha</span></div>
          <div className={`side-bar-button ${sideBarSelected === 'student' ? 'student' : ''}`} onClick={() => setSideBarSelected("student")}><Groups2 className="fas fa-student"/><span>Agenda</span></div>
          <div className={`side-bar-button ${sideBarSelected === 'exam' ? 'exam' : ''}`} onClick={() => setSideBarSelected("exam")}><School className="fas fa-exam"/><span>Exam List</span></div>
          <div className={`side-bar-button ${sideBarSelected === 'exam-room' ? 'exam-room' : ''}`} onClick={() => setSideBarSelected("exam-room")}><ArticleOutlined className="fas fa-exam-room"/><span>Exam Room List</span></div>
          <hr/>
          <div className={`side-bar-button ${sideBarSelected === 'template' ? 'template' : ''}`} onClick={() => setSideBarSelected("template")}><DvrOutlined className="fas fa-template"/><span>Session Template</span></div>
          
          <div id="side-bar-content-highlight"></div>
        </div>
      </div>
    </>
  )
}
