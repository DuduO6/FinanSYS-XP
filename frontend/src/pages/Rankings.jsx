import { useEffect, useMemo, useState } from 'react'
import { listRanking } from '../services/gamificationService.js'
import { getBadgeAsset } from '../utils/badgeAssets.js'
import logoImage from '../data/logo.png'
import '../styles/Rankings.css'

export default function Rankings() {
  const [ranking, setRanking] = useState([])
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadRanking() {
      setIsLoading(true)
      setError('')

      try {
        setRanking(await listRanking())
      } catch (requestError) {
        setError(requestError.message)
      } finally {
        setIsLoading(false)
      }
    }

    loadRanking()
  }, [])

  const topThree = useMemo(() => ranking.slice(0, 3), [ranking])

  if (isLoading) {
    return (
      <main className="rankings-page">
        <p className="empty-state">Carregando ranking...</p>
      </main>
    )
  }

  if (error) {
    return (
      <main className="rankings-page">
        <div className="form-alert error" role="alert">{error}</div>
      </main>
    )
  }

  return (
    <main className="rankings-page">
      <header className="rankings-header">
        <div>
          <img className="page-logo" src={logoImage} alt="FinanSYS XP" />
          <h1>Rankings</h1>
          <p>Pessoas cadastradas no FinanSYS XP ordenadas pelo nível obtido.</p>
        </div>
      </header>

      {ranking.length === 0 ? (
        <p className="empty-state">Nenhuma pessoa cadastrada para exibir.</p>
      ) : (
        <section className="rankings-layout" aria-label="Lista de ranking">
          <div className="ranking-podium">
            {topThree.map((user) => (
              <article className={`podium-card position-${user.position}`} key={user.id}>
                <span className="podium-position">#{user.position}</span>
                <img className="ranking-avatar ranking-badge" src={getBadgeAsset(user.level_class)} alt={`Insígnia ${user.level_class}`} />
                <div>
                  <h2>{user.name}</h2>
                  <p>{user.level_class} · Nível {user.level} · {user.xp} XP</p>
                </div>
              </article>
            ))}
          </div>

          <div className="ranking-list">
            {ranking.map((user) => (
              <article className={user.is_current_user ? 'ranking-row current-user' : 'ranking-row'} key={user.id}>
                <strong className="ranking-position">#{user.position}</strong>
                <img className="ranking-avatar ranking-badge" src={getBadgeAsset(user.level_class)} alt={`Insígnia ${user.level_class}`} />
                <div className="ranking-person">
                  <strong>{user.name}</strong>
                  {user.is_current_user && <span>Você</span>}
                </div>
                <div className="ranking-level">
                  <span>{user.level_class}</span>
                  <strong>{user.level}</strong>
                </div>
                <div className="ranking-xp">
                  <span>{user.xp} XP</span>
                  <div className="ranking-progress" aria-label={`Progresso de ${user.progress}% até o próximo nível`}>
                    <span style={{ width: `${user.progress}%` }} />
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </main>
  )
}
