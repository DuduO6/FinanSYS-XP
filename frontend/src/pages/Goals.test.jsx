import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Goals from './Goals.jsx'

describe('Goals', () => {
  beforeEach(() => {
    localStorage.setItem('finansys.auth.token', 'token-teste')
    global.fetch = vi.fn()
  })

  it('lista metas retornadas pela API', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        {
          id: 1,
          title: 'Reserva de emergencia',
          target_amount: '6000.00',
          current_amount: '1200.00',
          deadline: '2026-12-31',
          status: 'active',
          progress: 20,
        },
      ],
    })

    render(<Goals onNavigate={vi.fn()} onLogout={vi.fn()} />)

    expect(await screen.findByText('Reserva de emergencia')).toBeInTheDocument()
    expect(screen.getByText('20%')).toBeInTheDocument()
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8000/api/goals/',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Token token-teste',
        }),
      }),
    )
  })

  it('cria uma nova meta e adiciona o card na tela', async () => {
    const user = userEvent.setup()
    fetch
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 2,
          title: 'Notebook',
          target_amount: '4000.00',
          current_amount: '1000.00',
          deadline: '2026-09-30',
          status: 'active',
          progress: 25,
        }),
      })

    render(<Goals onNavigate={vi.fn()} onLogout={vi.fn()} />)

    await user.type(screen.getByLabelText(/título/i), 'Notebook')
    await user.type(screen.getByLabelText(/valor alvo/i), '4000')
    await user.type(screen.getByLabelText(/valor atual/i), '1000')
    await user.clear(screen.getByLabelText(/prazo/i))
    await user.type(screen.getByLabelText(/prazo/i), '2026-09-30')
    await user.click(screen.getByRole('button', { name: /criar meta/i }))

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/goals/',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"title":"Notebook"'),
        }),
      )
    })
    expect(await screen.findByText('Notebook')).toBeInTheDocument()
    expect(screen.getByText('25%')).toBeInTheDocument()
  })

  it('exibe estado vazio quando nao ha metas', async () => {
    fetch.mockResolvedValueOnce({ ok: true, json: async () => [] })

    render(<Goals onNavigate={vi.fn()} onLogout={vi.fn()} />)

    expect(await screen.findByText(/nenhuma meta cadastrada/i)).toBeInTheDocument()
  })
})
