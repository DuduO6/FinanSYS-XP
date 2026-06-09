import { useEffect, useMemo, useState } from 'react'
import { listCategories } from '../services/categoryService.js'
import { createTransaction, listTransactions } from '../services/transactionService.js'
import '../styles/Transactions.css'

const initialForm = {
  title: '',
  transaction_type: 'expense',
  category: 'Alimentação',
  amount: '',
  date: new Date().toISOString().slice(0, 10),
  description: '',
}

const defaultCategories = ['Alimentação', 'Moradia', 'Transporte', 'Saúde', 'Educação', 'Lazer', 'Trabalho', 'Freelance', 'Investimentos', 'Outros']

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(value))
}

export default function Transactions() {
  const [transactions, setTransactions] = useState([])
  const [categories, setCategories] = useState([])
  const [form, setForm] = useState(initialForm)
  const [filter, setFilter] = useState('all')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const summary = useMemo(() => {
    return transactions.reduce(
      (totals, transaction) => {
        const amount = Number(transaction.amount)

        if (transaction.transaction_type === 'income') {
          totals.income += amount
        } else {
          totals.expenses += amount
        }

        totals.balance = totals.income - totals.expenses
        return totals
      },
      { income: 0, expenses: 0, balance: 0 },
    )
  }, [transactions])

  useEffect(() => {
    loadTransactions(filter)
  }, [filter])

  useEffect(() => {
    listCategories()
      .then((data) => setCategories(data.map((category) => category.name)))
      .catch(() => setCategories([]))
  }, [])

  async function loadTransactions(type = filter) {
    setIsLoading(true)
    setError('')
    setSuccessMessage('')

    try {
      const data = await listTransactions({ type })
      setTransactions(data)
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

  const categoryOptions = categories.length > 0 ? categories : defaultCategories

  async function submitTransaction(event) {
    event.preventDefault()
    setIsSubmitting(true)
    setError('')
    setSuccessMessage('')

    try {
      const createdTransaction = await createTransaction(form)
      setForm(initialForm)
      setSuccessMessage('Transação salva com sucesso.')

      if (filter === 'all' || filter === createdTransaction.transaction_type) {
        setTransactions((current) => [createdTransaction, ...current])
      }
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="transactions-page">
      <header className="transactions-header">
        <div>
          <span className="brand-badge">FinanSYS XP</span>
          <h1>Transações financeiras</h1>
          <p>Registre receitas e despesas para alimentar o dashboard, relatórios e XP.</p>
        </div>
      </header>

      <section className="summary-grid" aria-label="Resumo financeiro">
        <article>
          <span>Receitas</span>
          <strong>{formatCurrency(summary.income)}</strong>
        </article>
        <article>
          <span>Despesas</span>
          <strong>{formatCurrency(summary.expenses)}</strong>
        </article>
        <article>
          <span>Saldo</span>
          <strong>{formatCurrency(summary.balance)}</strong>
        </article>
      </section>

      <section className="transactions-layout">
        <form className="transaction-form" onSubmit={submitTransaction}>
          <div className="form-heading">
            <h2>Nova transação</h2>
            <p>Os dados são salvos na API Django autenticada.</p>
          </div>

          <label>
            Descrição
            <input name="title" value={form.title} onChange={updateField} placeholder="Ex: Mercado semanal" required />
          </label>

          <div className="form-row">
            <label>
              Tipo
              <select name="transaction_type" value={form.transaction_type} onChange={updateField}>
                <option value="expense">Despesa</option>
                <option value="income">Receita</option>
              </select>
            </label>

            <label>
              Categoria
              <select name="category" value={form.category} onChange={updateField}>
                {categoryOptions.map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="form-row">
            <label>
              Valor
              <input name="amount" type="number" min="0.01" step="0.01" value={form.amount} onChange={updateField} required />
            </label>

            <label>
              Data
              <input name="date" type="date" value={form.date} onChange={updateField} required />
            </label>
          </div>

          <label>
            Observação
            <textarea name="description" value={form.description} onChange={updateField} placeholder="Opcional" />
          </label>

          {error && <div className="form-alert error" role="alert">{error}</div>}
          {successMessage && <div className="form-alert success" role="status">{successMessage}</div>}

          <button className="primary-button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Salvando...' : 'Salvar transação'}
          </button>
        </form>

        <section className="transaction-panel">
          <div className="panel-heading">
            <div>
              <h2>Histórico</h2>
              <p>Lista de transações vinculadas ao usuário logado.</p>
            </div>
            <div className="filter-buttons" aria-label="Filtros">
              <button className={filter === 'all' ? 'active' : ''} type="button" onClick={() => setFilter('all')}>Todas</button>
              <button className={filter === 'income' ? 'active' : ''} type="button" onClick={() => setFilter('income')}>Receitas</button>
              <button className={filter === 'expense' ? 'active' : ''} type="button" onClick={() => setFilter('expense')}>Despesas</button>
            </div>
          </div>

          {isLoading ? (
            <p className="empty-state">Carregando transações...</p>
          ) : transactions.length === 0 ? (
            <p className="empty-state">Nenhuma transação cadastrada.</p>
          ) : (
            <div className="transaction-list">
              {transactions.map((transaction) => (
                <article className="transaction-item" key={transaction.id}>
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
        </section>
      </section>
    </main>
  )
}
