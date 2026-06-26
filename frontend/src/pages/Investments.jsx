import { useEffect, useMemo, useState } from 'react'
import { getDashboardSummary } from '../services/dashboardService.js'
import { createInvestment, listInvestments } from '../services/investmentService.js'
import logoImage from '../data/logo.png'
import '../styles/Investments.css'

const initialForm = {
  name: '',
  investment_type: 'Renda fixa',
  amount: '',
  start_date: new Date().toISOString().slice(0, 10),
}

const investmentTypes = [
  { value: 'Poupanca', label: 'Poupança', rate: '0,45%', probability: '95%' },
  { value: 'Renda fixa', label: 'Renda fixa', rate: '0,80%', probability: '88%' },
  { value: 'Tesouro Direto', label: 'Tesouro Direto', rate: '0,85%', probability: '86%' },
  { value: 'CDB', label: 'CDB', rate: '0,90%', probability: '84%' },
  { value: 'Fundo imobiliario', label: 'Fundo imobiliário', rate: '0,95%', probability: '68%' },
  { value: 'Acoes', label: 'Ações', rate: '1,30%', probability: '60%' },
  { value: 'Cripto', label: 'Cripto', rate: '2,20%', probability: '54%' },
  { value: 'Outros', label: 'Outros', rate: '0,70%', probability: '70%' },
]

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0))
}

export default function Investments() {
  const [investments, setInvestments] = useState([])
  const [form, setForm] = useState(initialForm)
  const [balance, setBalance] = useState(0)
  const [error, setError] = useState('')
  const total = useMemo(() => investments.reduce((sum, item) => sum + Number(item.amount), 0), [investments])
  const monthlyExpectedReturn = useMemo(() => investments.reduce((sum, item) => sum + Number(item.expected_return_amount || 0), 0), [investments])
  const actualReturn = useMemo(() => investments.reduce((sum, item) => sum + Number(item.actual_return_amount || 0), 0), [investments])
  const currentPortfolio = useMemo(() => investments.reduce((sum, item) => sum + Number(item.current_balance || item.amount), 0), [investments])

  useEffect(() => {
    loadInvestments()
  }, [])

  async function loadInvestments() {
    try {
      const [investmentsData, dashboardData] = await Promise.all([
        listInvestments(),
        getDashboardSummary(),
      ])
      setInvestments(investmentsData)
      setBalance(Number(dashboardData.summary?.balance || 0))
    } catch (requestError) {
      setError(requestError.message)
    }
  }

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
      const dashboardData = await getDashboardSummary()
      setBalance(Number(dashboardData.summary?.balance || 0))
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  return (
    <main className="investments-page">
      <header className="investments-header">
        <div>
          <img className="page-logo" src={logoImage} alt="FinanSYS XP" />
          <h1>Investimentos</h1>
          <p>Acompanhe aplicações, valores investidos e rendimento esperado.</p>
        </div>
      </header>

      <section className="investments-summary"><article><span>Saldo disponível</span><strong>{formatCurrency(balance)}</strong></article><article><span>Total aplicado</span><strong>{formatCurrency(total)}</strong></article><article><span>Retorno mensal esperado</span><strong>{formatCurrency(monthlyExpectedReturn)}</strong></article><article><span>Retorno obtido</span><strong>{formatCurrency(actualReturn)}</strong></article><article><span>Carteira atual</span><strong>{formatCurrency(currentPortfolio)}</strong></article><article><span>Ativos</span><strong>{investments.length}</strong></article></section>

      <section className="investments-layout">
        <form className="investment-form" onSubmit={submitInvestment}>
          <h2>Novo investimento</h2>
          <label>Nome<input name="name" value={form.name} onChange={updateField} required /></label>
          <label>Tipo<select name="investment_type" value={form.investment_type} onChange={updateField} required>{investmentTypes.map((type) => <option key={type.value} value={type.value}>{type.label} · {type.rate}/mês · {type.probability} positivo</option>)}</select></label>
          <label>Valor<input name="amount" type="number" min="0.01" step="0.01" value={form.amount} onChange={updateField} required /></label>
          <label>Data inicial<input name="start_date" type="date" value={form.start_date} onChange={updateField} required /></label>
          {error && <div className="investment-alert" role="alert">{error}</div>}
          <button type="submit">Salvar investimento</button>
        </form>

        <section className="investment-list">
          {investments.length === 0 ? <p>Nenhum investimento cadastrado.</p> : investments.map((investment) => (
            <article className="investment-card" key={investment.id}>
              <div><strong>{investment.name}</strong><span>{investment.investment_type} · {investment.start_date}</span></div>
              <strong>{formatCurrency(investment.amount)}</strong>
              <small>{investment.expected_return_rate}% ao mês · {investment.monthly_gain_probability}% chance de mês positivo</small>
              <small>Obtido: {formatCurrency(investment.actual_return_amount)} · Carteira: {formatCurrency(investment.current_balance)}</small>
            </article>
          ))}
        </section>
      </section>
    </main>
  )
}
