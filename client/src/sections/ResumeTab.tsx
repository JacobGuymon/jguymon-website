function ResumeTab() {
  return (
    <section className="resume-tab">
      <h2 className="sr-only">Resume</h2>
      <object className="resume-embed" data="/resume.pdf" type="application/pdf">
        <p>
          PDF preview isn't supported in this browser. <a href="/resume.pdf">Download the resume</a>{' '}
          instead.
        </p>
      </object>
    </section>
  )
}

export default ResumeTab
