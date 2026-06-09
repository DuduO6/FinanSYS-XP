import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { login, registerAccount, saveAuthToken } from '../services/authService.js'
import '../styles/AuthPage.css'

const authSchema = z
  .object({
    name: z.string().optional(),
    email: z.string().email('Informe um e-mail válido.'),
    password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres.'),
    confirmPassword: z.string().optional(),
  })
  .superRefine((data, context) => {
    if (data.confirmPassword && data.password !== data.confirmPassword) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'As senhas precisam ser iguais.',
        path: ['confirmPassword'],
      })
    }
  })

export default function AuthPage({ onSubmitAuth }) {
  const [mode, setMode] = useState('login')
  const [submitError, setSubmitError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(authSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  const isRegister = mode === 'register'

  function changeMode(nextMode) {
    setMode(nextMode)
    setSubmitError('')
    setSuccessMessage('')
    reset()
  }

  async function submitForm(data) {
    setSubmitError('')
    setSuccessMessage('')

    try {
      const payload = isRegister
        ? {
            name: data.name,
            email: data.email,
            password: data.password,
            confirmPassword: data.confirmPassword,
          }
        : {
            email: data.email,
            password: data.password,
          }
      const response = isRegister ? await registerAccount(payload) : await login(payload)

      saveAuthToken(response.token)
      setSuccessMessage(isRegister ? 'Conta criada com sucesso.' : 'Login realizado com sucesso.')
      onSubmitAuth?.({ mode, data: payload, response })
    } catch (error) {
      setSubmitError(error.message)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-hero" aria-labelledby="auth-title">
        <span className="brand-badge">FinanSYS XP</span>
        <h1 id="auth-title">Controle financeiro com progresso, metas e recompensas.</h1>
        <p>
          Entre para acompanhar receitas, despesas, metas financeiras, XP, níveis e conquistas em uma
          única plataforma.
        </p>
      </section>

      <section className="auth-card" aria-label="Formulário de autenticação">
        <div className="auth-tabs" role="tablist" aria-label="Escolha entre login e cadastro">
          <button
            aria-selected={!isRegister}
            className={!isRegister ? 'active' : ''}
            type="button"
            onClick={() => changeMode('login')}
          >
            Login
          </button>
          <button
            aria-selected={isRegister}
            className={isRegister ? 'active' : ''}
            type="button"
            onClick={() => changeMode('register')}
          >
            Cadastro
          </button>
        </div>

        <form onSubmit={handleSubmit(submitForm)} noValidate>
          <div className="form-heading">
            <h2>{isRegister ? 'Criar conta' : 'Acessar conta'}</h2>
            <p>{isRegister ? 'Cadastre seus dados para iniciar o controle.' : 'Use e-mail e senha para continuar.'}</p>
          </div>

          {isRegister && (
            <label>
              Nome
              <input type="text" placeholder="Seu nome" {...register('name')} />
            </label>
          )}

          <label>
            E-mail
            <input type="email" placeholder="voce@email.com" {...register('email')} />
            {errors.email && <small className="field-error">{errors.email.message}</small>}
          </label>

          <label>
            Senha
              <input type="password" placeholder="Mínimo de 6 caracteres" {...register('password')} />
            {errors.password && <small className="field-error">{errors.password.message}</small>}
          </label>

          {isRegister && (
            <label>
              Confirmar senha
              <input type="password" placeholder="Repita sua senha" {...register('confirmPassword')} />
              {errors.confirmPassword && <small className="field-error">{errors.confirmPassword.message}</small>}
            </label>
          )}

          {submitError && <div className="form-alert error" role="alert">{submitError}</div>}
          {successMessage && <div className="form-alert success" role="status">{successMessage}</div>}

          <button className="primary-button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Enviando...' : isRegister ? 'Criar conta' : 'Entrar'}
          </button>
        </form>
      </section>
    </main>
  )
}
