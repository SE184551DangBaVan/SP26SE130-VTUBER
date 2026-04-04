import './TerminalWindow.css'

const TerminalWindow = ({ windowWidth, windowHeight, windowTitle, windowContent }) => {
  return (
    <div className="terminal" style={{width: `${windowWidth}`, height: `${windowHeight}`}}>
        <div className="terminal-header">
            <div className="buttons">
            <span className="close"></span>
            <span className="minimize"></span>
            <span className="maximize"></span>
            </div>
            <div className="title">{windowTitle}</div>
        </div>
        <div className="terminal-body">
            <div className="terminal-loader">
            <span className="loader-text">{windowContent}</span>
            <span id="dot1" className="dot">.</span>
            <span id="dot2" className="dot">.</span>
            <span id="dot3" className="dot">.</span>
            </div>
        </div>
    </div>
  )
}

export default TerminalWindow;