import { useEffect, useState } from 'react'
import { getProfile, updateProfile } from '../services/profileService.js'
import logoImage from '../data/logo.png'
import '../styles/Profile.css'

export default function Profile() {
  const [profile, setProfile] = useState(null)
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    getProfile()
      .then((data) => {
        setProfile(data)
        setName(data.user.name || '')
      })
      .catch((requestError) => setError(requestError.message))
  }, [])

  async function submitProfile(event) {
    event.preventDefault()
    setError('')
    setSuccess('')

    try {
      const data = await updateProfile({ name })
      setProfile(data)
      setSuccess('Perfil atualizado.')
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  return (
    <main className="profile-page">
      <header className="profile-header">
        <div>
          <img className="page-logo" src={logoImage} alt="FinanSYS XP" />
          <h1>Perfil</h1>
          <p>Dados da conta e estatísticas pessoais.</p>
        </div>
      </header>

      {error && <div className="profile-alert error" role="alert">{error}</div>}
      {success && <div className="profile-alert success" role="status">{success}</div>}
      {!profile ? <p className="profile-empty">Carregando perfil...</p> : (
        <section className="profile-layout">
          <form className="profile-form" onSubmit={submitProfile}>
            <h2>Dados pessoais</h2>
            <label>Nome<input value={name} onChange={(event) => setName(event.target.value)} /></label>
            <label>E-mail<input value={profile.user.email} disabled /></label>
            <button type="submit">Salvar perfil</button>
          </form>
          <section className="profile-stats">
            <article><span>Transações</span><strong>{profile.stats.transactions}</strong></article>
            <article><span>Metas</span><strong>{profile.stats.goals}</strong></article>
            <article><span>Metas concluídas</span><strong>{profile.stats.completed_goals}</strong></article>
            <article><span>Investimentos</span><strong>{profile.stats.investments}</strong></article>
          </section>
        </section>
      )}
    </main>
  )
}
