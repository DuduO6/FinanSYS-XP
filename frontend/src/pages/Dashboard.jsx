import { useEffect, useMemo, useState } from 'react'
import { getCurrentUser, getAuthToken } from '../services/authService.js'
import { listCategories } from '../services/categoryService.js'
import { getDashboardSummary } from '../services/dashboardService.js'
import logoImage from '../data/logo.png'
import '../styles/Dashboard.css'

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(value || 0))
}

function getGreeting() {
  const hour = new Date().getHours()

  if (hour < 12) {
    return 'Bom dia'
  }

  if (hour < 18) {
    return 'Boa tarde'
  }

  return 'Boa noite'
}

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const [dashboard, setDashboard] = useState(null)
  const [categoryColors, setCategoryColors] = useState({})
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  const userName = useMemo(() => {
    if (!user) {
      return 'usuário'
    }

    return user.first_name || user.username || user.email
  }, [user])

  useEffect(() => {
    async function loadDashboard() {
      setIsLoading(true)
      setError('')

      try {
        const token = getAuthToken()
        const [currentUser, dashboardData, categoriesData] = await Promise.all([
          getCurrentUser(token),
          getDashboardSummary(),
          listCategories(),
        ])

        setUser(currentUser)
        setDashboard(dashboardData)
        setCategoryColors(
          categoriesData.reduce((colors, category) => {
            colors[category.name] = category.color
            return colors
          }, {}),
        )
      } catch (requestError) {
        setError(requestError.message)
      } finally {
        setIsLoading(false)
      }
    }

    loadDashboard()
  }, [])

  if (isLoading) {
    return (
      <main className="dashboard-page">
        <p className="empty-state">Carregando dashboard...</p>
      </main>
    )
  }

  if (error) {
    return (
      <main className="dashboard-page">
        <div className="form-alert error" role="alert">{error}</div>
      </main>
    )
  }

  const summary = dashboard?.summary || { income: 0, expenses: 0, balance: 0 }
  const gamification = dashboard?.gamification || { xp: 0, level: 1, progress: 0, next_level_xp: 200 }
  const isPositiveBalance = Number(summary.balance) >= 0
  const expensesByCategory = dashboard?.expenses_by_category || []
  const recentTransactions = dashboard?.recent_transactions || []
  const monthlyEvolution = dashboard?.monthly_evolution || []
  const maxCategoryExpense = Math.max(...expensesByCategory.map((item) => Number(item.amount)), 1)
  const maxMonthlyValue = Math.max(
    ...monthlyEvolution.flatMap((item) => [Number(item.income), Number(item.expenses)]),
    1,
  )
  const getCategoryColor = (category, transactionType = 'expense') => {
    return categoryColors[category] || (transactionType === 'income' ? '#34d399' : '#ef4444')
  }

  return (
    <main className="dashboard-page">
      <header className="dashboard-hero">
        <div>
          <img className="page-logo" src={logoImage} alt="FinanSYS XP" />
          <h1>{getGreeting()}, {userName}</h1>
          <p>Resumo do seu mês financeiro, progresso de XP e movimentações recentes.</p>
        </div>
        <aside className={isPositiveBalance ? 'dashboard-balance-pill positive' : 'dashboard-balance-pill negative'} aria-label="Status do saldo">
          <span>{isPositiveBalance ? 'Saldo positivo' : 'Saldo negativo'}</span>
          <strong>{formatCurrency(summary.balance)}</strong>
        </aside>
      </header>

      <section className="summary-grid" aria-label="Resumo financeiro">
        <article className="metric-card income">
          <div className="metric-icon" aria-hidden="true">+</div>
          <span>Receitas</span>
          <strong>{formatCurrency(summary.income)}</strong>
        </article>
        <article className="metric-card expense">
          <div className="metric-icon" aria-hidden="true">-</div>
          <span>Despesas</span>
          <strong>{formatCurrency(summary.expenses)}</strong>
        </article>
        <article className={isPositiveBalance ? 'metric-card summary-balance positive' : 'metric-card summary-balance negative'}>
          <div className="metric-icon" aria-hidden="true">=</div>
          <span>Saldo atual</span>
          <strong>{formatCurrency(summary.balance)}</strong>
        </article>
      </section>

      <section className="dashboard-layout">
        <article className="dashboard-card xp-card">
          <div className="panel-heading">
            <div>
              <h2>Nível {gamification.level}</h2>
              <p>{gamification.xp} XP acumulados · progresso até o próximo nível</p>
            </div>
            <strong>{gamification.progress}%</strong>
          </div>
          <div className="progress-track" aria-label="Progresso de XP" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={gamification.progress}>
            <span style={{ width: `${gamification.progress}%` }} />
          </div>
          <p className="dashboard-note">Próximo marco em {gamification.next_level_xp} XP.</p>
        </article>

        <article className="dashboard-card">
          <div className="panel-heading">
            <div>
              <h2>Gastos por categoria</h2>
              <p>Distribuição visual das despesas registradas.</p>
            </div>
          </div>
          <div className="chart-legend" aria-label="Legenda de categorias">
            <span><i className="legend-category" />Cor da categoria</span>
            <span><i className="legend-expense" />Valor gasto</span>
          </div>
          {expensesByCategory.length === 0 ? (
            <p className="empty-state">Sem despesas registradas.</p>
          ) : (
            <div className="dashboard-bar-list">
              {expensesByCategory.map((item) => (
                <article className="dashboard-bar-row" key={item.category} style={{ '--category-color': getCategoryColor(item.category) }}>
                  <div>
                    <span><i aria-hidden="true" />{item.category}</span>
                    <strong>{formatCurrency(item.amount)}</strong>
                  </div>
                  <div className="dashboard-bar-track">
                    <span style={{ width: `${Math.round((Number(item.amount) / maxCategoryExpense) * 100)}%` }} />
                  </div>
                </article>
              ))}
            </div>
          )}
        </article>

        <article className="dashboard-card">
          <div className="panel-heading">
            <div>
              <h2>Evolução mensal</h2>
              <p>Comparação entre receitas e despesas por mês.</p>
            </div>
          </div>
          <div className="chart-legend" aria-label="Legenda da evolução mensal">
            <span><i className="legend-income" />Receitas</span>
            <span><i className="legend-expense" />Despesas</span>
          </div>
          {monthlyEvolution.length === 0 ? (
            <p className="empty-state">Sem movimentações suficientes para gráfico.</p>
          ) : (
            <div className="monthly-chart">
              {monthlyEvolution.map((item) => (
                <article className="monthly-chart-row" key={item.month}>
                  <div className="monthly-bars" aria-label={`Receitas e despesas de ${item.month}`}>
                    <span className="income-bar" style={{ height: `${Math.max(8, Math.round((Number(item.income) / maxMonthlyValue) * 100))}%` }} />
                    <span className="expense-bar" style={{ height: `${Math.max(8, Math.round((Number(item.expenses) / maxMonthlyValue) * 100))}%` }} />
                  </div>
                  <strong>{item.month}</strong>
                  <small><b>R</b> {formatCurrency(item.income)}</small>
                  <small><b>D</b> {formatCurrency(item.expenses)}</small>
                </article>
              ))}
            </div>
          )}
        </article>

        <article className="dashboard-card recent-card">
          <div className="panel-heading">
            <div>
              <h2>Últimas transações</h2>
              <p>Movimentações mais recentes da conta.</p>
            </div>
          </div>
          {recentTransactions.length === 0 ? (
            <p className="empty-state">Cadastre sua primeira transação.</p>
          ) : (
            <div className="transaction-list">
              {recentTransactions.map((transaction) => (
                <article
                  className="transaction-item"
                  key={transaction.id}
                  style={{ '--category-color': getCategoryColor(transaction.category, transaction.transaction_type) }}
                >
                  <div>
                    <strong>{transaction.title}</strong>
                    <span>{transaction.category} · {transaction.date}</span>
                  </div>
                  <strong className={transaction.transaction_type === 'income' ? 'income-value' : 'expense-value'}>
                    {transaction.transaction_type === 'income' ? '+' : '-'} {formatCurrency(transaction.amount)}
                  </strong>
                </article>
              ))}
            </div>
          )}
        </article>
      </section>
    </main>
  )
}
