import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Dashboard from './Dashboard.jsx'

describe('Dashboard', () => {
  beforeEach(() => {
    localStorage.setItem('finansys.auth.token', 'token-teste')
    global.fetch = vi.fn()
  })

  it('exibe saudacao com o nome do usuario e resumo financeiro', async () => {
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ first_name: 'Dudu', email: 'dudu@ufv.br', username: 'dudu@ufv.br' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          summary: { income: '3000.00', expenses: '250.00', balance: '2750.00' },
          expenses_by_category: [{ category: 'Alimentação', amount: '250.00' }],
          recent_transactions: [
            {
              id: 1,
              title: 'Mercado',
              transaction_type: 'expense',
              category: 'Alimentação',
              amount: '250.00',
              date: '2026-06-09',
            },
          ],
          gamification: { xp: 40, level: 1, next_level_xp: 200, progress: 20 },
        }),
      })

    render(<Dashboard onNavigate={vi.fn()} onLogout={vi.fn()} />)

    expect(await screen.findByRole('heading', { name: /dudu/i })).toBeInTheDocument()
    expect(screen.getByText(/R\$\s*3\.000,00/)).toBeInTheDocument()
    expect(screen.getByText('Mercado')).toBeInTheDocument()
    expect(screen.getByText('Nível 1')).toBeInTheDocument()
  })

  it('exibe estado vazio de categorias e transacoes', async () => {
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ first_name: 'Dudu', email: 'dudu@ufv.br', username: 'dudu@ufv.br' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          summary: { income: '0.00', expenses: '0.00', balance: '0.00' },
          expenses_by_category: [],
          recent_transactions: [],
          gamification: { xp: 0, level: 1, next_level_xp: 200, progress: 0 },
        }),
      })

    render(<Dashboard onNavigate={vi.fn()} onLogout={vi.fn()} />)

    await screen.findByRole('heading', { name: /dudu/i })
    expect(screen.getByText(/sem despesas registradas/i)).toBeInTheDocument()
    expect(screen.getByText(/cadastre sua primeira transação/i)).toBeInTheDocument()
  })
})
