import { useEffect, useMemo, useState } from 'react'
import { createGoal, listGoals, updateGoal } from '../services/goalService.js'
import '../styles/Goals.css'

const initialForm = {
  title: '',
  target_amount: '',
  current_amount: '',
  deadline: new Date().toISOString().slice(0, 10),
  description: '',
}

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(value || 0))
}

function getStatusLabel(status) {
  const labels = {
    active: 'Ativa',
    completed: 'Concluída',
    paused: 'Pausada',
  }

  return labels[status] || status
}

export default function Goals() {
  const [goals, setGoals] = useState([])
  const [form, setForm] = useState(initialForm)
  const [filter, setFilter] = useState('all')
  const [editingValues, setEditingValues] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const summary = useMemo(() => {
    return goals.reduce(
      (totals, goal) => {
        totals.target += Number(goal.target_amount)
        totals.current += Number(goal.current_amount)
        totals.completed += goal.status === 'completed' ? 1 : 0
        return totals
      },
      { target: 0, current: 0, completed: 0 },
    )
  }, [goals])

  useEffect(() => {
    loadGoals(filter)
  }, [filter])

  async function loadGoals(status = filter) {
    setIsLoading(true)
    setError('')
    setSuccessMessage('')

    try {
      const data = await listGoals({ status })
      setGoals(data)
      setEditingValues(
        data.reduce((values, goal) => {
          values[goal.id] = goal.current_amount
          return values
        }, {}),
      )
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsLoading(false)
    }
  }

  function updateField(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  function updateEditingValue(goalId, value) {
    setEditingValues((current) => ({ ...current, [goalId]: value }))
  }

  async function submitGoal(event) {
    event.preventDefault()
    setIsSubmitting(true)
    setError('')
    setSuccessMessage('')

    try {
      const createdGoal = await createGoal({
        ...form,
        current_amount: form.current_amount || '0',
      })
      setForm(initialForm)
      setSuccessMessage('Meta criada com sucesso.')

      if (filter === 'all' || filter === createdGoal.status) {
        setGoals((current) => [createdGoal, ...current])
        setEditingValues((current) => ({ ...current, [createdGoal.id]: createdGoal.current_amount }))
      }
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function saveProgress(goal) {
    setError('')
    setSuccessMessage('')

    try {
      const updatedGoal = await updateGoal(goal.id, {
        current_amount: editingValues[goal.id],
        status: Number(editingValues[goal.id]) >= Number(goal.target_amount) ? 'completed' : goal.status,
      })

      setGoals((current) => current.map((item) => (item.id === goal.id ? updatedGoal : item)))
      setEditingValues((current) => ({ ...current, [updatedGoal.id]: updatedGoal.current_amount }))
      setSuccessMessage('Progresso atualizado.')
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  return (
    <main className="goals-page">
      <header className="goals-header">
        <div>
          <span className="goals-badge">FinanSYS XP</span>
          <h1>Metas financeiras</h1>
          <p>Planeje reservas, compras e objetivos com acompanhamento de progresso.</p>
        </div>
      </header>

      <section className="goals-summary" aria-label="Resumo de metas">
        <article>
          <span>Total planejado</span>
          <strong>{formatCurrency(summary.target)}</strong>
        </article>
        <article>
          <span>Já guardado</span>
          <strong>{formatCurrency(summary.current)}</strong>
        </article>
        <article>
          <span>Concluídas</span>
          <strong>{summary.completed}</strong>
        </article>
      </section>

      <section className="goals-layout">
        <form className="goal-form" onSubmit={submitGoal}>
          <div className="goals-panel-heading">
            <h2>Nova meta</h2>
            <p>Defina objetivo, prazo e valor inicial economizado.</p>
          </div>

          <label>
            Título
            <input name="title" value={form.title} onChange={updateField} placeholder="Ex: Reserva de emergência" required />
          </label>

          <div className="goal-form-row">
            <label>
              Valor alvo
              <input name="target_amount" type="number" min="0.01" step="0.01" value={form.target_amount} onChange={updateField} required />
            </label>

            <label>
              Valor atual
              <input name="current_amount" type="number" min="0" step="0.01" value={form.current_amount} onChange={updateField} placeholder="0,00" />
            </label>
          </div>

          <label>
            Prazo
            <input name="deadline" type="date" value={form.deadline} onChange={updateField} required />
          </label>

          <label>
            Descrição
            <textarea name="description" value={form.description} onChange={updateField} placeholder="Opcional" />
          </label>

          {error && <div className="goals-alert error" role="alert">{error}</div>}
          {successMessage && <div className="goals-alert success" role="status">{successMessage}</div>}

          <button className="goals-primary-button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Criando...' : 'Criar meta'}
          </button>
        </form>

        <section className="goals-panel">
          <div className="goals-panel-heading with-actions">
            <div>
              <h2>Suas metas</h2>
              <p>Acompanhe o andamento e atualize valores guardados.</p>
            </div>
            <div className="goal-filters" aria-label="Filtros de metas">
              <button className={filter === 'all' ? 'active' : ''} type="button" onClick={() => setFilter('all')}>Todas</button>
              <button className={filter === 'active' ? 'active' : ''} type="button" onClick={() => setFilter('active')}>Ativas</button>
              <button className={filter === 'completed' ? 'active' : ''} type="button" onClick={() => setFilter('completed')}>Concluídas</button>
            </div>
          </div>

          {isLoading ? (
            <p className="goals-empty-state">Carregando metas...</p>
          ) : goals.length === 0 ? (
            <p className="goals-empty-state">Nenhuma meta cadastrada.</p>
          ) : (
            <div className="goals-list">
              {goals.map((goal) => (
                <article className="goal-card" key={goal.id}>
                  <div className="goal-card-header">
                    <div>
                      <span>{getStatusLabel(goal.status)}</span>
                      <h3>{goal.title}</h3>
                      <p>Prazo: {goal.deadline}</p>
                    </div>
                    <strong>{goal.progress}%</strong>
                  </div>

                  <div className="goal-progress-track" aria-label={`Progresso de ${goal.title}`} role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={goal.progress}>
                    <span style={{ width: `${goal.progress}%` }} />
                  </div>

                  <div className="goal-amounts">
                    <span>{formatCurrency(goal.current_amount)}</span>
                    <span>{formatCurrency(goal.target_amount)}</span>
                  </div>

                  <div className="goal-update-row">
                    <label>
                      Atualizar valor
                      <input type="number" min="0" max={goal.target_amount} step="0.01" value={editingValues[goal.id] || ''} onChange={(event) => updateEditingValue(goal.id, event.target.value)} />
                    </label>
                    <button className="goals-secondary-button" type="button" onClick={() => saveProgress(goal)}>
                      Salvar
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  )
}
