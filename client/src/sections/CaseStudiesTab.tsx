import { useState } from 'react'
import { caseStudies } from './caseStudies.data'

function CaseStudiesTab() {
  const [index, setIndex] = useState(0)

  const goTo = (next: number) => {
    setIndex((next + caseStudies.length) % caseStudies.length)
  }

  const current = caseStudies[index]

  return (
    <section className="case-studies">
      <h2 className="sr-only">Case Studies</h2>
      <p className="case-study-counter">
        Case study {index + 1} of {caseStudies.length}
      </p>
      <div className="case-study-stack">
        {caseStudies.map((study, i) => (
          <div
            key={study.title}
            className={i === index ? 'case-study-card active' : 'case-study-card'}
            aria-hidden={i !== index}
          >
            <p className="case-study-tag">{study.tag}</p>
            <h3 className="case-study-title">{study.title}</h3>
            <ul className="case-study-body">
              {study.body.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <p className="sr-only" role="status" aria-live="polite">
        Showing case study {index + 1} of {caseStudies.length}: {current.title}
      </p>
      <div className="carousel-controls">
        <button type="button" aria-label="Previous case study" onClick={() => goTo(index - 1)}>
          ‹
        </button>
        <div className="carousel-dots">
          {caseStudies.map((study, i) => (
            <button
              key={study.title}
              type="button"
              aria-label={`Go to case study ${i + 1}`}
              aria-current={i === index}
              className={i === index ? 'carousel-dot active' : 'carousel-dot'}
              onClick={() => setIndex(i)}
            />
          ))}
        </div>
        <button type="button" aria-label="Next case study" onClick={() => goTo(index + 1)}>
          ›
        </button>
      </div>
    </section>
  )
}

export default CaseStudiesTab
