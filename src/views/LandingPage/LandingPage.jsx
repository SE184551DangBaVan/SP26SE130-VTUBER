import RetroWindow from '../../components/RetroWindow/RetroWindow'
import './LandingPage.css'
import FumoImage from '../../assets/Decor/Fumo.png'
import FumoButBiggerImage from '../../assets/Decor/Fumo But Bigger.png'
import Tachynology from '../../assets/Decor/looking_up_manhattan_cafe_fanart.jpg'
import FumoOntoSomeShenanigans from '../../assets/Decor/epips-zvyalka-.jpg'
import ForwardButtonIco from '../../assets/UI-Elements/Forward.svg'
import BackwardButtonIco from '../../assets/UI-Elements/Backward.svg'
import PlayButtonIco from '../../assets/UI-Elements/Play.svg'

import { useState, useRef, useEffect } from 'react';

export default function LandingPage() {
  const [navScrollOffset, setNavScrollOffset] = useState(0);
  const rafRef = useRef(null);
  const lastScrollValue = useRef(0);

  // Throttled scroll handler using requestAnimationFrame
  useEffect(() => {
    const handleScroll = () => {
      if (rafRef.current) return;

      rafRef.current = requestAnimationFrame(() => {
        const currentScroll = window.scrollY || window.pageYOffset;
        if (Math.abs(currentScroll - lastScrollValue.current) > 2) {
          lastScrollValue.current = currentScroll;
          setNavScrollOffset(currentScroll);
        }
        rafRef.current = null;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  return (
    <div className='landing-page-container'>
        <div className="taped-picture">
            {/* <div className="top-tape"></div> */}
            <div className="tape-section"></div>
            <img className='Fumo-pic' src={FumoOntoSomeShenanigans.src} alt=''></img>
            <a href="https://www.artstation.com/zvyalka_epips" target="_blank" rel="noopener noreferrer">Art by: Epips Zvyalka</a>
            <div className="tape-section"></div>
        </div>
        <div className="halftone"></div>
        <div className='website-banner' >
            <div className='desktop-apps'></div>
            <div className='desktop-wallpaper'>
                <img className='desktop-wallpaper-Fumo' src={FumoImage.src} alt=""></img>
                <a href="https://www.pixiv.net/en/users/73548147" target="_blank" rel="noopener noreferrer">Art by: 是水鬼吗。</a>
            </div>
            <RetroWindow
                windowWidth="640px" 
                windowHeight="400px"
                windowColor="yellow" //there is only red, blue, yellow
                windowTitle="Introduction"
                windowContent={(
                    <div className='retro-window-content'>
                        <div className='retro-window-message'>
                            Ready For Your Journey
                            <br/>To Discover More
                            <br/>Communities Of Your
                            <br/>Favorite Vtuber?
                        </div>

                        <button className='retro-window-button'>Get Started!</button>
                    </div>
                )}
            />
            <RetroWindow
                windowWidth="500px" 
                windowHeight="150px"
                windowColor="red" //there is only red, blue, yellow
                windowTitle={<>LCB OST - Main Menu</>}
                windowContent={(
                    <div className='retro-window-content' >
                        <div className='music-controller'>
                            <button><img className='backward' src={BackwardButtonIco.src} alt=''></img></button>
                            <button><img className='pause' src={PlayButtonIco.src} alt=''></img></button>
                            <button><img className='forward' src={ForwardButtonIco.src} alt=''></img></button>
                        </div>
                        <div className='music-timeline'> </div>
                    </div>
                )}
            />
        </div>
        <div className='landing-page-hero' >
            <h1>Under Construction</h1>
        </div>
    </div>
  )
}
