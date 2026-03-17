import './RetroWindow.css'

const RetroWindow = ({ windowWidth, windowHeight, windowColor, windowTitle, windowContent }) => {
  return (
    <div className={`retro-window-container ${windowColor}`} style={{ width: `${windowWidth}`, height: `${windowHeight}` }}>
      <div className='window-border'>
        <span className='window-title'>{windowTitle}</span>
        <div className='window-buttons'>
            <button className='window-button-minimize'><img src='/UI-Element_Top_Minimize_Btn.svg' alt=''/></button>
            <button className='window-button-maximize'><img src='/UI-Element_Top_Maximize_Btn.svg' alt=''/></button>
            <button className='window-button-close'><img src='/UI-Element_Top_Close_Btn.svg' alt=''/></button>
        </div>
      </div>
      {windowContent}
    </div>
  )
}

export default RetroWindow;
