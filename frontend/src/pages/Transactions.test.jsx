import { render, screen, within, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Transactions from './Transactions.jsx'

describe('Transactions', () => {
  beforeEach(() => {
    localStorage.setItem('finansys.auth.token', 'token-teste')
    global.fetch = vi.fn()
  })

  it('lista transacoes retornadas pela API', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        {
          id: 1,
          title: 'Salario',
          transaction_type: 'income',
          category: 'Trabalho',
          amount: '2500.00',
          date: '2026-06-08',
        },
      ],
    })
    fetch.mockResolvedValueOnce({ ok: true, json: async () => [{ id: 1, name: 'Trabalho' }] })

    render(<Transactions />)

    const transactionTitle = await screen.findByText('Salario')
    expect(transactionTitle).toBeInTheDocument()
    expect(within(transactionTitle.closest('article')).getByText(/Trabalho/)).toBeInTheDocument()
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8000/api/transactions/',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Token token-teste',
        }),
      }),
    )
  })

  it('cadastra uma nova transação e recarrega a lista', async () => {
    const user = userEvent.setup()
    fetch
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
      .mockResolvedValueOnce({ ok: true, json: async () => [{ id: 1, name: 'Alimentação' }] })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 2,
          title: 'Mercado',
          transaction_type: 'expense',
          category: 'Alimentação',
          amount: '120.00',
          date: '2026-06-08',
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            id: 2,
            title: 'Mercado',
            transaction_type: 'expense',
            category: 'Alimentação',
            amount: '120.00',
            date: '2026-06-08',
          },
        ],
      })

    render(<Transactions />)

    await user.type(screen.getByLabelText(/descrição/i), 'Mercado')
    await user.clear(screen.getByLabelText(/valor/i))
    await user.type(screen.getByLabelText(/valor/i), '120')
    await user.click(screen.getByRole('button', { name: /salvar transação/i }))

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/transactions/',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"title":"Mercado"'),
        }),
      )
    })
    expect(await screen.findByText('Mercado')).toBeInTheDocument()
  })
})
