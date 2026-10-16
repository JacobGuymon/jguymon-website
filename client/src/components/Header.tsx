import headshot from '../assets/headshot.jpg'

interface HeaderProps {
  onContactClick: () => void
}

function Header({ onContactClick }: HeaderProps) {
  return (
    <header className="site-header">
      <div className="site-header-identity">
        <img className="headshot" src={headshot} alt="Jay Guymon" />
        <div>
          <h1 className="site-name">Jay Guymon</h1>
          <p className="site-title">Senior Software Engineer — Agentic AI &amp; SDLC Automation</p>
        </div>
      </div>
      <div className="site-header-actions">
        <a className="button button-primary" href="/resume.pdf" download>
          Download Resume
        </a>
        <button className="button button-secondary" onClick={onContactClick}>
          Contact
        </button>
      </div>
    </header>
  )
}

export default Header
