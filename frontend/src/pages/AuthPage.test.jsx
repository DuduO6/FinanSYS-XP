import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import AuthPage from './AuthPage.jsx'

describe('AuthPage', () => {
  beforeEach(() => {
    localStorage.clear()
    global.fetch = vi.fn()
  })

  it('renderiza o formulario de login por padrao', () => {
    render(<AuthPage />)

    expect(screen.getByRole('heading', { name: /acessar conta/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument()
  })

  it('alterna para cadastro e exibe campos extras', async () => {
    const user = userEvent.setup()
    render(<AuthPage />)

    await user.click(screen.getByRole('button', { name: /cadastro/i }))

    expect(screen.getByRole('heading', { name: /criar conta/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/nome/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/confirmar senha/i)).toBeInTheDocument()
  })

  it('valida campos obrigatorios antes de enviar', async () => {
    const user = userEvent.setup()
    const onSubmitAuth = vi.fn()
    render(<AuthPage onSubmitAuth={onSubmitAuth} />)

    await user.click(screen.getByRole('button', { name: /entrar/i }))

    expect(await screen.findByText(/informe um e-mail válido/i)).toBeInTheDocument()
    expect(onSubmitAuth).not.toHaveBeenCalled()
  })

  it('envia os dados de login quando o formulario e valido', async () => {
    const user = userEvent.setup()
    const onSubmitAuth = vi.fn()
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        token: 'token-teste',
        user: { id: 1, email: 'aluno@ufv.br' },
      }),
    })
    render(<AuthPage onSubmitAuth={onSubmitAuth} />)

    await user.type(screen.getByLabelText(/e-mail/i), 'aluno@ufv.br')
    await user.type(screen.getByLabelText(/^senha$/i), '123456')
    await user.click(screen.getByRole('button', { name: /entrar/i }))

    expect(await screen.findByText(/login realizado com sucesso/i)).toBeInTheDocument()
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8000/api/auth/login/',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          email: 'aluno@ufv.br',
          password: '123456',
        }),
      }),
    )
    expect(localStorage.getItem('finansys.auth.token')).toBe('token-teste')
    expect(onSubmitAuth).toHaveBeenCalledWith({
      mode: 'login',
      data: {
        email: 'aluno@ufv.br',
        password: '123456',
      },
      response: {
        token: 'token-teste',
        user: { id: 1, email: 'aluno@ufv.br' },
      },
    })
  })

  it('mostra erro retornado pela API', async () => {
    const user = userEvent.setup()
    fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ detail: 'E-mail ou senha inválidos.' }),
    })
    render(<AuthPage />)

    await user.type(screen.getByLabelText(/e-mail/i), 'aluno@ufv.br')
    await user.type(screen.getByLabelText(/^senha$/i), '123456')
    await user.click(screen.getByRole('button', { name: /entrar/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/e-mail ou senha inválidos/i)
  })
})
