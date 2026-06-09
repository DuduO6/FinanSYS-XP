import { useEffect, useState } from 'react'
import { getGamification } from '../services/gamificationService.js'
import '../styles/Achievements.css'

export default function Achievements() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    getGamification().then(setData).catch((requestError) => setError(requestError.message))
  }, [])

  return (
    <main className="achievements-page">
      <header className="achievements-header">
        <div>
          <span className="achievements-badge">FinanSYS XP</span>
          <h1>Conquistas e desafios</h1>
          <p>Seu progresso financeiro convertido em XP, níveis e recompensas.</p>
        </div>
      </header>

      {error && <div className="achievement-alert" role="alert">{error}</div>}
      {!data ? <p className="achievement-empty">Carregando gamificacao...</p> : (
        <>
          <section className="xp-panel">
            <div><span>Nível {data.level}</span><strong>{data.xp} XP</strong></div>
            <div className="achievement-progress"><span style={{ width: `${data.progress}%` }} /></div>
          </section>
          <section className="achievement-grid">
            {data.achievements.map((achievement) => (
              <article className={achievement.unlocked ? 'achievement-card unlocked' : 'achievement-card'} key={achievement.id}>
                <span>{achievement.unlocked ? 'OK' : '--'}</span>
                <h2>{achievement.title}</h2>
                <p>{achievement.description}</p>
              </article>
            ))}
          </section>
          <section className="challenge-grid">
            {data.challenges.map((challenge) => (
              <article className="challenge-card" key={challenge.id}>
                <strong>{challenge.title}</strong>
                <span>{challenge.xp} XP</span>
                <div className="achievement-progress"><span style={{ width: `${challenge.progress}%` }} /></div>
              </article>
            ))}
          </section>
        </>
      )}
    </main>
  )
}
