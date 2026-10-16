import { useRef, useState, type KeyboardEvent } from 'react'
import Header from './components/Header'
import Footer from './components/Footer'
import CaseStudiesTab from './sections/CaseStudiesTab'
import ResumeTab from './sections/ResumeTab'
import ContactTab from './sections/ContactTab'
import './App.css'

type TabId = 'case-studies' | 'resume' | 'contact'

const TABS: { id: TabId; label: string }[] = [
  { id: 'case-studies', label: 'Case Studies' },
  { id: 'resume', label: 'Resume' },
  { id: 'contact', label: 'Contact' },
]

function App() {
  const [activeTab, setActiveTab] = useState<TabId>('case-studies')
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])

  const focusTab = (nextIndex: number) => {
    const wrapped = (nextIndex + TABS.length) % TABS.length
    setActiveTab(TABS[wrapped].id)
    tabRefs.current[wrapped]?.focus()
  }

  const handleTabKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      focusTab(index + 1)
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      focusTab(index - 1)
    } else if (e.key === 'Home') {
      e.preventDefault()
      focusTab(0)
    } else if (e.key === 'End') {
      e.preventDefault()
      focusTab(TABS.length - 1)
    }
  }

  return (
    <>
      <Header onContactClick={() => setActiveTab('contact')} />
      <nav className="tab-nav" role="tablist" aria-label="Site sections">
        {TABS.map((tab, i) => (
          <button
            key={tab.id}
            ref={(el) => {
              tabRefs.current[i] = el
            }}
            id={`tab-${tab.id}`}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`panel-${tab.id}`}
            tabIndex={activeTab === tab.id ? 0 : -1}
            className={activeTab === tab.id ? 'tab-button active' : 'tab-button'}
            onClick={() => setActiveTab(tab.id)}
            onKeyDown={(e) => handleTabKeyDown(e, i)}
          >
            {tab.label}
          </button>
        ))}
      </nav>
      <main
        className="tab-panel"
        role="tabpanel"
        id={`panel-${activeTab}`}
        aria-labelledby={`tab-${activeTab}`}
      >
        {activeTab === 'case-studies' && <CaseStudiesTab />}
        {activeTab === 'resume' && <ResumeTab />}
        {activeTab === 'contact' && <ContactTab />}
      </main>
      <Footer />
    </>
  )
}

export default App
