import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchEstatisticas } from '../store/estatisticasSlice'
import Layout from '../components/Layout'
import './Estatisticas.css'

export default function Estatisticas() {
  const dispatch = useDispatch()
  const { items, status } = useSelector(s => s.estatisticas)

  useEffect(() => {
    if (status === 'idle') dispatch(fetchEstatisticas())
  }, [dispatch, status])

  // Win rate do Fortnite (primeiro jogo)
  const fortnite = items.find(i => i.jogo === 'Fortnite')
  const wins     = fortnite?.stats.find(s => s.label === 'Vitórias')?.valor ?? 0
  const matches  = fortnite?.stats.find(s => s.label === 'Partidas')?.valor ?? 1
  const wr       = Math.round((wins / matches) * 100)
  const dash     = (wr / 100) * 113

  return (
    <Layout>
      <h1 className="title">Estatísticas</h1>

      {status === 'loading' && <p className="loading-msg">Carregando estatísticas...</p>}

      <div className="stats-grid">
        {items.map(jogo => (
          <div className="game-stats" key={jogo.id}>
            <div className="game-header">
              <img src={`/img/${jogo.imagem}`} alt={jogo.jogo} onError={e => e.target.style.display='none'} />
              <h3>{jogo.jogo}</h3>
            </div>

            {/* Win rate ring apenas para Fortnite */}
            {jogo.jogo === 'Fortnite' && (
              <div className="win-rate-chart">
                <p className="wr-label">Win Rate</p>
                <div className="wr-ring-wrap">
                  <svg viewBox="0 0 44 44" className="wr-ring">
                    <circle cx="22" cy="22" r="18" fill="none" stroke="#242a33" strokeWidth="4" />
                    <circle cx="22" cy="22" r="18" fill="none" stroke="var(--primary)" strokeWidth="4"
                      strokeDasharray={`${dash} 113`} strokeDashoffset="28" strokeLinecap="round" className="wr-arc" />
                  </svg>
                  <span className="wr-pct">{wr}%</span>
                </div>
              </div>
            )}

            <div className="rank-box">
              {jogo.rankIcone && (
                <img src={`/img/${jogo.rankIcone}`} className="rank-icon" alt={jogo.rank}
                  onError={e => e.target.style.display='none'} />
              )}
              <div>
                <p className="rank-title">{jogo.jogo === 'Clash Royale' ? 'Troféus' : 'Rank'}</p>
                <h2>{jogo.rank}</h2>
              </div>
            </div>

            <div className="stats-list">
              {jogo.stats.map(s => (
                <div key={s.label}>
                  <p>{s.label}</p>
                  <strong>{s.decimal
                    ? s.valor.toFixed(2).replace('.', ',')
                    : s.valor.toLocaleString('pt-BR')}
                  </strong>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Layout>
  )
}
