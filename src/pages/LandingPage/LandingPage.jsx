import RetroWindow from '../../components/RetroWindow/RetroWindow'
import './LandingPage.css'
import FumoImage from '../../assets/Decor/Fumo.png'
import FumoButBiggerImage from '../../assets/Decor/Fumo But Bigger.png'
import ForwardButtonIco from '../../assets/UI-Elements/Forward.svg'
import BackwardButtonIco from '../../assets/UI-Elements/Backward.svg'
import PlayButtonIco from '../../assets/UI-Elements/Play.svg'

import { useScroll, useMotionValueEvent } from "framer-motion";
import { useState } from 'react';

export default function LandingPage() {
  const [navScrollOffset, setNavScrollOffset] = useState(0);

  const { scrollY } = useScroll();
    useMotionValueEvent(scrollY, "change", (latest) => {
      setNavScrollOffset(latest);
  });

  return (
    <div className='landing-page-container'>
        <div className='website-banner'>
            <div className='desktop-wallpaper'>
                <img className='desktop-wallpaper-Fumo' src={FumoImage} alt=""></img>
                <img className='desktop-wallpaper-Fumo-Bigger' src={FumoButBiggerImage} alt=""></img>
            </div>
            <RetroWindow
                windowWidth="600px" 
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
                windowHeight="100px"
                windowColor="red" //there is only red, blue, yellow
                windowTitle={<>LCB OST - Main Menu</>}
                windowContent={(
                    <div className={`retro-window-content ${navScrollOffset < 140 ? 'move' : 'stay'}` }>
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
    </div>
  )
}
