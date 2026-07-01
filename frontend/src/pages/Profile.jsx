import { useEffect, useState } from 'react'
import { clearAuthToken } from '../services/authService.js'
import { deleteProfile, getProfile, updatePassword, updateProfile } from '../services/profileService.js'
import { getBadgeAsset } from '../utils/badgeAssets.js'
import '../styles/Profile.css'

export default function Profile({ onLogout }) {
  const [profile, setProfile] = useState(null)
  const [name, setName] = useState('')
  const [passwordForm, setPasswordForm] = useState({ current_password: '', new_password: '' })
  const [deletePassword, setDeletePassword] = useState('')
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

  async function submitPassword(event) {
    event.preventDefault()
    setError('')
    setSuccess('')

    try {
      await updatePassword(passwordForm)
      clearAuthToken()
      setSuccess('Senha atualizada. Faça login novamente.')
      onLogout?.()
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  async function submitDeleteAccount(event) {
    event.preventDefault()
    setError('')
    setSuccess('')

    try {
      await deleteProfile(deletePassword)
      clearAuthToken()
      onLogout?.()
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  const displayName = profile?.user.name || profile?.user.username || profile?.user.email || 'Usuário'

  return (
    <main className="profile-page">
      {error && <div className="profile-alert error" role="alert">{error}</div>}
      {success && <div className="profile-alert success" role="status">{success}</div>}
      {!profile ? <p className="profile-empty">Carregando perfil...</p> : (
        <section className="profile-layout">
          <section className="profile-badge-panel" aria-label="Insígnia atual">
            <img
              src={getBadgeAsset(profile.gamification?.level_class)}
              alt={`Insígnia ${profile.gamification?.level_class || 'Iniciante Financeiro'}`}
            />
            <div>
              <h1>{displayName}</h1>
              <span>{profile.gamification?.level_class || 'Iniciante Financeiro'}</span>
              <p>Nível {profile.gamification?.level || 1} · {profile.gamification?.xp || 0} XP acumulados</p>
            </div>
          </section>
          <form className="profile-form" onSubmit={submitProfile}>
            <h2>Dados pessoais</h2>
            <label>Nome<input value={name} onChange={(event) => setName(event.target.value)} /></label>
            <label>E-mail<input value={profile.user.email} disabled /></label>
            <button type="submit">Salvar perfil</button>
          </form>
          <section className="profile-stats" aria-label="Estatísticas do perfil">
            <article><span>Transações</span><strong>{profile.stats.transactions}</strong></article>
            <article><span>Metas / Concluídas</span><strong>{profile.stats.goals} / {profile.stats.completed_goals}</strong></article>
            <article><span>Investimentos</span><strong>{profile.stats.investments}</strong></article>
          </section>
          <form className="profile-form" onSubmit={submitPassword}>
            <h2>Mudar senha</h2>
            <label>Senha atual<input type="password" value={passwordForm.current_password} onChange={(event) => setPasswordForm((current) => ({ ...current, current_password: event.target.value }))} /></label>
            <label>Nova senha<input type="password" value={passwordForm.new_password} onChange={(event) => setPasswordForm((current) => ({ ...current, new_password: event.target.value }))} /></label>
            <button type="submit">Atualizar senha</button>
          </form>
          <form className="profile-form danger-zone" onSubmit={submitDeleteAccount}>
            <h2>Apagar conta</h2>
            <p>Esta ação remove sua conta e encerra a sessão.</p>
            <label>Confirme sua senha<input type="password" value={deletePassword} onChange={(event) => setDeletePassword(event.target.value)} /></label>
            <button type="submit">Apagar conta</button>
          </form>
        </section>
      )}
    </main>
  )
}
