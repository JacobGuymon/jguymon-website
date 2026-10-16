import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import ContactTab from './ContactTab'

async function fillForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Name'), 'Ada Lovelace')
  await user.type(screen.getByLabelText('Email'), 'ada@example.com')
  await user.type(screen.getByLabelText('Message'), 'Hello there')
}

describe('ContactTab', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('honeypot field is present but hidden from assistive tech and tab order', () => {
    render(<ContactTab />)
    const honeypot = screen.getByLabelText('Website')
    expect(honeypot).toHaveAttribute('tabIndex', '-1')
    expect(honeypot.closest('label')).toHaveAttribute('aria-hidden', 'true')
  })

  it('submits form fields as JSON and shows success state on 200', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ success: true }), { status: 200 }),
    )
    const user = userEvent.setup()
    render(<ContactTab />)

    await fillForm(user)
    await user.click(screen.getByRole('button', { name: /send message/i }))

    await waitFor(() =>
      expect(screen.getByText(/thanks for reaching out/i)).toBeInTheDocument(),
    )

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/contact',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          Name: 'Ada Lovelace',
          Email: 'ada@example.com',
          Message: 'Hello there',
          Website: '',
        }),
      }),
    )
  })

  it('disables submit button while the request is in flight', async () => {
    let resolveFetch!: (value: Response) => void
    vi.spyOn(globalThis, 'fetch').mockReturnValue(
      new Promise((resolve) => {
        resolveFetch = resolve
      }),
    )
    const user = userEvent.setup()
    render(<ContactTab />)

    await fillForm(user)
    const submitButton = screen.getByRole('button', { name: /send message/i })
    await user.click(submitButton)

    expect(submitButton).toBeDisabled()
    expect(screen.getByRole('button', { name: /sending/i })).toBeInTheDocument()

    resolveFetch(new Response(JSON.stringify({ success: true }), { status: 200 }))
    await waitFor(() => expect(screen.getByText(/thanks for reaching out/i)).toBeInTheDocument())
  })

  it('shows server-provided validation errors on 400', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ success: false, errors: ['A valid email address is required.'] }), {
        status: 400,
      }),
    )
    const user = userEvent.setup()
    render(<ContactTab />)

    await fillForm(user)
    await user.click(screen.getByRole('button', { name: /send message/i }))

    expect(await screen.findByText('A valid email address is required.')).toBeInTheDocument()
  })

  it('shows a generic error on a non-400 failure response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 502 }))
    const user = userEvent.setup()
    render(<ContactTab />)

    await fillForm(user)
    await user.click(screen.getByRole('button', { name: /send message/i }))

    expect(
      await screen.findByText(/failed to send message\. please try again later\./i),
    ).toBeInTheDocument()
  })

  it('shows a network error message when fetch rejects', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'))
    const user = userEvent.setup()
    render(<ContactTab />)

    await fillForm(user)
    await user.click(screen.getByRole('button', { name: /send message/i }))

    expect(await screen.findByText(/network error/i)).toBeInTheDocument()
  })
})
