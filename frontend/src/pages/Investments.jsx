import { useEffect, useMemo, useState } from 'react'
import { createInvestment, listInvestments } from '../services/investmentService.js'
import '../styles/Investments.css'

const initialForm = {
  name: '',
  investment_type: 'Renda fixa',
  amount: '',
  expected_return_rate: '0',
  start_date: new Date().toISOString().slice(0, 10),
}

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0))
}

export default function Investments() {
  const [investments, setInvestments] = useState([])
  const [form, setForm] = useState(initialForm)
  const [error, setError] = useState('')
  const total = useMemo(() => investments.reduce((sum, item) => sum + Number(item.amount), 0), [investments])

  useEffect(() => {
    listInvestments().then(setInvestments).catch((requestError) => setError(requestError.message))
  }, [])

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  async function submitInvestment(event) {
    event.preventDefault()
    setError('')

    try {
      const investment = await createInvestment(form)
      setInvestments((current) => [investment, ...current])
      setForm(initialForm)
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  return (
    <main className="investments-page">
      <header className="investments-header">
        <div>
          <span className="investments-badge">FinanSYS XP</span>
          <h1>Investimentos</h1>
          <p>Acompanhe aplicações, valores investidos e rendimento esperado.</p>
        </div>
      </header>

      <section className="investments-summary"><article><span>Total aplicado</span><strong>{formatCurrency(total)}</strong></article><article><span>Ativos</span><strong>{investments.length}</strong></article></section>

      <section className="investments-layout">
        <form className="investment-form" onSubmit={submitInvestment}>
          <h2>Novo investimento</h2>
          <label>Nome<input name="name" value={form.name} onChange={updateField} required /></label>
          <label>Tipo<input name="investment_type" value={form.investment_type} onChange={updateField} required /></label>
          <label>Valor<input name="amount" type="number" min="0.01" step="0.01" value={form.amount} onChange={updateField} required /></label>
          <label>Retorno esperado %<input name="expected_return_rate" type="number" step="0.01" value={form.expected_return_rate} onChange={updateField} /></label>
          <label>Data inicial<input name="start_date" type="date" value={form.start_date} onChange={updateField} required /></label>
          {error && <div className="investment-alert" role="alert">{error}</div>}
          <button type="submit">Salvar investimento</button>
        </form>

        <section className="investment-list">
          {investments.length === 0 ? <p>Nenhum investimento cadastrado.</p> : investments.map((investment) => (
            <article className="investment-card" key={investment.id}>
              <div><strong>{investment.name}</strong><span>{investment.investment_type} · {investment.start_date}</span></div>
              <strong>{formatCurrency(investment.amount)}</strong>
              <small>{investment.expected_return_rate}% esperado</small>
            </article>
          ))}
        </section>
      </section>
    </main>
  )
}
