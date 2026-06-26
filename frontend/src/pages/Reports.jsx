import { useEffect, useMemo, useState } from 'react'
import { getReports } from '../services/reportsService.js'
import logoImage from '../data/logo.png'
import '../styles/Reports.css'

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0))
}

export default function Reports() {
  const [reports, setReports] = useState(null)
  const [error, setError] = useState('')
  const maxCategory = useMemo(() => Math.max(...(reports?.expenses_by_category || []).map((item) => Number(item.amount)), 1), [reports])

  useEffect(() => {
    getReports().then(setReports).catch((requestError) => setError(requestError.message))
  }, [])

  return (
    <main className="reports-page">
      <header className="reports-header">
        <div>
          <img className="page-logo" src={logoImage} alt="FinanSYS XP" />
          <h1>Relatórios</h1>
          <p>Visualize sua evolução financeira e onde o dinheiro está indo.</p>
        </div>
      </header>

      {error && <div className="report-alert" role="alert">{error}</div>}
      {!reports ? <p className="report-empty">Carregando relatórios...</p> : (
        <>
          <section className="reports-summary">
            <article><span>Receitas</span><strong>{formatCurrency(reports.summary.income)}</strong></article>
            <article><span>Despesas</span><strong>{formatCurrency(reports.summary.expenses)}</strong></article>
            <article><span>Saldo</span><strong>{formatCurrency(reports.summary.balance)}</strong></article>
          </section>
          <section className="reports-layout">
            <article className="report-panel">
              <h2>Gastos por categoria</h2>
              {(reports.expenses_by_category || []).map((item) => (
                <div className="bar-row" key={item.category}>
                  <span>{item.category}</span>
                  <div><i style={{ width: `${Math.round((Number(item.amount) / maxCategory) * 100)}%` }} /></div>
                  <strong>{formatCurrency(item.amount)}</strong>
                </div>
              ))}
            </article>
            <article className="report-panel">
              <h2>Evolução mensal</h2>
              {(reports.monthly_evolution || []).map((item) => (
                <div className="monthly-row" key={item.month}>
                  <strong>{item.month}</strong>
                  <span>Receitas {formatCurrency(item.income)}</span>
                  <span>Despesas {formatCurrency(item.expenses)}</span>
                </div>
              ))}
            </article>
          </section>
        </>
      )}
    </main>
  )
}
