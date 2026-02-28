import './Hero.css'
import GlowButton from '../../../../components/GlowButton/GlowButton'
import Portrait from '../../../../assets/style-retro-wave-and-vaporwave-vintage-compute.jpg'
import Showcase from '../../../../assets/Discord_UI_Components_Mockup.png'
import PoweredTV from '../../../../components/OperableTerebi/PoweredTV';
import React, { useEffect, useRef, useState } from "react"
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import ReactIcon from '../../../../assets/react.svg'
import WebSocket from '../../../../assets/WebSocket_colored_logo.svg'
import GitHubIcon from '@mui/icons-material/GitHub';
import JavascriptIcon from '@mui/icons-material/Javascript';
import Plugs from '../../../../components/PowerPlug/Plugs';

export default function Hero() {
  const outletRef = useRef(null);
  const plugRef = useRef(null);
  const cordRef = useRef(null);

  const [plugged, setPlugged] = useState(true);
  const [powerPlug, setPowerPlug] = useState(true);
  const [run, setRun] = useState(false);
  const [scrollOffset, setScrollOffset] = useState(0);

  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrollOffset(latest);
  });

  const handleMouseEnter = () => {
    setRun(true);
  };

  const handleMouseLeave = () => {
    setRun(false);
    setPlugged(true);
  };

  const handleOutletClick = (e) => {
    if (run) {
      setRun(false);
      setPlugged(true);

      document.documentElement.style.setProperty(
        "--bg-color",
        `hsl(${Math.floor(Math.random() * 360)}deg, 75%, 50%)`
      );
    } else {
      setRun(true);
      setPlugged(false);
      document.documentElement.style.setProperty("--bg-color", "#ccc");

      const x = e.clientX - 20;
      const y = e.clientY + scrollOffset - 20;

      plugRef.current.style.left = `${x}px`;
      plugRef.current.style.top = `${y - 10}px`;
      cordRef.current.style.width = `${window.innerWidth - x - 22}px`;
      cordRef.current.style.height = `${window.innerHeight - y }px`;
    }
  };

  const moveThePlug = (e) => {
    const evt = e.type === "touchmove" ? e.touches[0] : e;
    if (run && plugRef.current && cordRef.current) {
      const x = evt.clientX - 20;
      const y = evt.clientY + scrollOffset - 20;

      plugRef.current.style.left = `${x}px`;
      plugRef.current.style.top = `${y - 10}px`;
      cordRef.current.style.width = `${window.innerWidth - x - 22}px`;
      cordRef.current.style.height = `${window.innerHeight - y + 100}px`;
    }
  };

  useEffect(() => {
    window.addEventListener("mousemove", moveThePlug);
    window.addEventListener("touchmove", moveThePlug);
    const handleScroll = () => {
      if (scrollOffset > 500) {
        setPowerPlug(true);
      }
      else {
        setPowerPlug(false);
      }
    };
      
    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("mousemove", moveThePlug);
      window.removeEventListener("touchmove", moveThePlug);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [run, scrollOffset]);

  return (
    <main className="hero">

      <div className="halftone"></div>
      <div className="hero-content">
        <h1>Dedicated Vtuber <br/>Community Center   <span>FanHub</span></h1><div className="paper">{'My Oshi <3'}</div>
        <div className="misc"></div>
        <div className="misc2"></div>
        <div className="misc3"></div>
        <div className="content-body"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}>
          <div className="content-body-left">
            <img src={Portrait} alt='Computer app'></img>
            <div className="descriptor">
              <p>
                <span className="fancy">Empowering</span> fans with a <span className='emphasis-color'>better</span> way to interact with the community,
                and attempt to <span className="fancy">mimic</span> Reddit.
              </p>
              <GlowButton children={'Learn More'} />
            </div>
            <div className="typing-block-showcase">
              <div className="typing-block-showcase_container">
                <h3 className="form-header">Announcement Board: </h3>
                <div className="wrapper">
                  <div className="typing-demo">
                    Stream Now!
                  </div>
                  <div className="typing-demo2">
                    New Merch is out~
                  </div>
                </div>
              </div>
            </div>
            <div className="typing-block-showcase-shadow"></div>
          </div>
          <div className="content-body-right">
            <div className="television">
              <PoweredTV powered={!plugged} />
            </div>
            <div className="power-source">
              <div id='outlet' ref={outletRef} onClick={handleOutletClick}></div>
              <div id='plug' ref={plugRef}
                className={plugged ? "plugged" : ""}
                style={{}}>
              </div>
              <div id='cord' ref={cordRef}></div>
              <div className="cableContainer clearfix" style={{ transform: `translate(100px, ${-scrollOffset * 2.4 + 1600}px)` }}>
                <div className="ftl cord2">
                  <div className="pr cord_top">
                    <div className="jack1"></div>
                    <div className="jack2"></div>
                  </div>
                  <div className="pr cord_middle">
                    <div className="smile">
                      <div className="pa eye1"></div>
                      <div className="pa eye2"></div>
                      <div className="pa mouth"></div>
                    </div>
                  </div>
                  <div className="cord_bottom"></div>
                  <div className="wire"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="cableContainer2 clearfix" style={{ transform: `translate(0, ${-scrollOffset*0.3 + 3260}px)` }}>
        <div className="ftl cord2">
          <div className="pr cord_top">
            <div className="jack1"></div>
            <div className="jack2"></div>
          </div>
          <div className="pr cord_middle">
            <div className="smile">
              <div className="pa eye1"></div>
              <div className="pa eye2"></div>
              <div className="pa mouth"></div>
            </div>
          </div>
          <div className="cord_bottom"></div>
          <div className="wire"></div>
        </div>
      </div>
      <div className="tools-involved" id='demo'>
        <ul className="rowsOfLogo">
          <li><GitHubIcon /> <span>GitHub</span></li>
          <li><img className='image-icon' src={ReactIcon} /> <span>ReactJS</span></li>
          <li><JavascriptIcon /> <span>JavaScript</span></li>
          <li><img className='image-icon' src={WebSocket} /><span className='registered-trademark'>R</span> <span>WebSocket</span></li>
        </ul>
      </div>
      <Plugs isOn={powerPlug} />

      
      <div className='showcaseBox'>
        {powerPlug &&
          <div className="showcaseContainer">
            <span>Mockup Showcase</span>
            
          </div>
        }
      </div>
    </main>
  )
}
