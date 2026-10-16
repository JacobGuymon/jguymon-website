import { useState, type FormEvent } from 'react'

type Status = 'idle' | 'submitting' | 'success' | 'error'

function ContactTab() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [website, setWebsite] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [errors, setErrors] = useState<string[]>([])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setStatus('submitting')
    setErrors([])

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Name: name, Email: email, Message: message, Website: website }),
      })

      if (res.ok) {
        setStatus('success')
        setName('')
        setEmail('')
        setMessage('')
        return
      }

      if (res.status === 400) {
        const data = await res.json()
        setErrors(data.errors ?? ['Please check the form and try again.'])
        setStatus('error')
        return
      }

      if (res.status === 429) {
        setErrors(['Too many messages sent. Please wait a few minutes and try again.'])
        setStatus('error')
        return
      }

      setErrors(['Failed to send message. Please try again later.'])
      setStatus('error')
    } catch {
      setErrors(['Network error. Please try again later.'])
      setStatus('error')
    }
  }

  return (
    <section className="contact-tab">
      <h2 className="sr-only">Contact</h2>

      {status === 'success' ? (
        <p className="contact-success" role="status" aria-live="polite">
          Thanks for reaching out — I'll get back to you soon.
        </p>
      ) : (
        <form className="contact-form" onSubmit={handleSubmit}>
          <label className="contact-field">
            <span>Name</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={200}
              required
            />
          </label>

          <label className="contact-field">
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              maxLength={320}
              required
            />
          </label>

          <label className="contact-field">
            <span>Message</span>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={5000}
              rows={6}
              required
            />
          </label>

          <label className="contact-honeypot" aria-hidden="true">
            <span>Website</span>
            <input
              type="text"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
            />
          </label>

          {errors.length > 0 && (
            <ul className="contact-errors" role="alert" aria-live="assertive">
              {errors.map((err) => (
                <li key={err}>{err}</li>
              ))}
            </ul>
          )}

          <div className="contact-actions">
            <button type="submit" className="button button-primary" disabled={status === 'submitting'}>
              {status === 'submitting' ? 'Sending…' : 'Send Message'}
            </button>
            <a className="contact-mailto" href="mailto:jacob.c.guymon@gmail.com">
              or email me directly
            </a>
          </div>
        </form>
      )}
    </section>
  )
}

export default ContactTab
