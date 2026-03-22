import RetroWindow from '../../components/RetroWindow/RetroWindow'
import './LandingPage.css'
import FumoImage from '../../assets/Decor/Fumo.png'
import FumoButBiggerImage from '../../assets/Decor/Fumo But Bigger.png'
import Tachynology from '../../assets/Decor/looking_up_manhattan_cafe_fanart.jpg'
import FumoOntoSomeShenanigans from '../../assets/Decor/epips-zvyalka-.jpg'
import ForwardButtonIco from '../../assets/UI-Elements/Forward.svg'
import BackwardButtonIco from '../../assets/UI-Elements/Backward.svg'
import PlayButtonIco from '../../assets/UI-Elements/Play.svg'

import { useScroll, useMotionValueEvent } from "framer-motion";
import { useState } from 'react';
import { Link } from 'react-router-dom'

export default function LandingPage() {
  const [navScrollOffset, setNavScrollOffset] = useState(0);

  const { scrollY } = useScroll();
    useMotionValueEvent(scrollY, "change", (latest) => {
      setNavScrollOffset(latest);
  });

  return (
    <div className='landing-page-container'>
        <div class="taped-picture">
            {/* <div class="top-tape"></div> */}
            <div class="tape-section"></div>
            <img className='Fumo-pic' src={FumoOntoSomeShenanigans} alt=''></img>
            <Link to="https://www.artstation.com/zvyalka_epips">Art by: Epips Zvyalka</Link>
            <div class="tape-section"></div>
        </div>
        <div class="taped-picture">
            {/* <div class="top-tape"></div> */}
            <div class="tape-section"></div>
            <img className='Fumo-pic' src={FumoOntoSomeShenanigans} alt=''></img>
            <Link to="https://www.artstation.com/zvyalka_epips">Art by: Epips Zvyalka</Link>
            <div class="tape-section"></div>
        </div>
        <div className="halftone"></div>
        <div className='website-banner' >
            <div className='desktop-apps'></div>
            <div className='desktop-wallpaper'>
                <img className='desktop-wallpaper-Fumo' src={FumoImage} alt=""></img>
                <Link to="https://www.pixiv.net/en/users/73548147">Art by: 是水鬼吗。</Link>
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
                            <br/>Communities For Your
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
                            <button><img className='backward' src={BackwardButtonIco} alt=''></img></button>
                            <button><img className='pause' src={PlayButtonIco} alt=''></img></button>
                            <button><img className='forward' src={ForwardButtonIco} alt=''></img></button>
                        </div>
                        <div className='music-timeline'> </div>
                    </div>
                )}
            />
        </div>
        <div className='landing-page-hero' >
            <h1>Nugger</h1>
        </div>
    </div>
  )
}
