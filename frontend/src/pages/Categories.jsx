import { useEffect, useState } from 'react'
import { createCategory, listCategories } from '../services/categoryService.js'
import '../styles/Categories.css'

const initialForm = { name: '', color: '#157f65', icon: 'tag' }
const defaultCategoryNames = new Set([
  'Alimentação',
  'Moradia',
  'Transporte',
  'Saúde',
  'Educação',
  'Lazer',
  'Trabalho',
  'Freelance',
  'Investimentos',
  'Outros',
])

export default function Categories() {
  const [categories, setCategories] = useState([])
  const [form, setForm] = useState(initialForm)
  const [error, setError] = useState('')

  useEffect(() => {
    listCategories().then(setCategories).catch((requestError) => setError(requestError.message))
  }, [])

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  async function submitCategory(event) {
    event.preventDefault()
    setError('')

    try {
      const category = await createCategory(form)
      setCategories((current) => [category, ...current])
      setForm(initialForm)
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  return (
    <main className="categories-page">
      <header className="categories-header">
        <div>
          <span className="categories-badge">FinanSYS XP</span>
          <h1>Categorias</h1>
          <p>Crie categorias para organizar seus lançamentos. Elas aparecem no cadastro de transações.</p>
        </div>
      </header>

      <section className="categories-layout">
        <form className="category-form" onSubmit={submitCategory}>
          <h2>Nova categoria</h2>
          <p>Use nomes como Alimentação, Saúde, Estudos ou Transporte para filtrar melhor seus gastos.</p>
          <label>Nome<input name="name" value={form.name} onChange={updateField} required /></label>
          <label>Cor<input name="color" type="color" value={form.color} onChange={updateField} /></label>
          <label>Ícone<input name="icon" value={form.icon} onChange={updateField} /></label>
          {error && <div className="category-alert" role="alert">{error}</div>}
          <button type="submit">Criar categoria</button>
        </form>

        <section className="category-grid">
          <div className="category-help">
            <h2>Categorias disponíveis</h2>
            <p>
              O sistema já cria categorias básicas para despesas comuns. Você pode criar novas para
              necessidades específicas, como Pets, Academia, Viagem ou Faculdade.
            </p>
          </div>
          {categories.length === 0 ? <p>Nenhuma categoria cadastrada. Ao criar uma, ela ficará disponível nas transações.</p> : categories.map((category) => (
            <article className="category-card" key={category.id} style={{ borderLeftColor: category.color }}>
              <span style={{ background: category.color }}>{category.icon.slice(0, 2).toUpperCase()}</span>
              <div>
                <strong>{category.name}</strong>
                <small>{defaultCategoryNames.has(category.name) ? 'Predefinida' : 'Criada por você'}</small>
              </div>
              <small>{category.color}</small>
            </article>
          ))}
        </section>
      </section>
    </main>
  )
}
