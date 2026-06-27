import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchModulos } from '../store/modulosSlice'
import { fetchProgressos } from '../store/progressoSlice'
import Layout from '../components/Layout'
import './Progressos.css'
//maia
export default function Progressos() {
  const dispatch = useDispatch()
  const { items } = useSelector(s => s.modulos)
  // Mapa { moduloId: status } com o progresso PESSOAL do usuário logado
  const progressoPorModulo = useSelector(s => s.progresso.byModulo)
  // s == state

  useEffect(() => {
    // Busca os módulos (total) e o progresso pessoal do usuário
    dispatch(fetchModulos())
    dispatch(fetchProgressos())
  }, [dispatch])

  // Contadores baseados no progresso PESSOAL, não mais no status global.
  const valores     = Object.values(progressoPorModulo)
  const concluidos  = valores.filter(s => s === 'completed').length
  const emAndamento = valores.filter(s => s === 'in-progress').length
  const pct         = items.length ? Math.round((concluidos / items.length) * 100) : 0
  // m == modulos
  return (
    <Layout>
      <h1 className="title">Meus progressos</h1>

      <section className="progress-summary">
        <div className="progress-stats">
          <div className="stat-card">
            <h3>{concluidos}</h3>
            <p>Módulos completos</p>
          </div>
          <div className="stat-card">
            <h3>{emAndamento}</h3>
            <p>Em andamento</p>
          </div>
        </div>

        <div className="overall-progress">
          <div className="overall-progress__header">
            <span>Progresso geral do curso</span>
            <span className="overall-progress__pct">{pct}%</span>
          </div>
          <div className="overall-progress__bar">
            <div className="overall-progress__fill" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </section>

      <section className="video-progress">
        <h2 className="title-small">Treinos e vídeos</h2>
        <div className="video-grid">
          <div className="video-card completed">
            <div className="video-thumb">
              <img src="/img/fortnite.jpg" alt="Fortnite" onError={e => e.target.style.display='none'} />
            </div>
            <h4>Treino de Mira Fortnite</h4>
          </div>
          <div className="video-card completed">
            <div className="video-thumb">
              <img src="/img/rainbow.jpg" alt="Rainbow" onError={e => e.target.style.display='none'} />
            </div>
            <h4>Controle de Recoil Rainbow Six</h4>
          </div>
          <div className="video-card in-progress">
            <div className="video-thumb">
              <img src="/img/clash.jpg" alt="Clash" onError={e => e.target.style.display='none'} />
            </div>
            <h4>Deck competitivo Clash Royale</h4>
          </div>
          <div className="video-card">
            <div className="video-thumb">
              <img src="/img/lol.jpg" alt="League of Legends" onError={e => e.target.style.display='none'} />
            </div>
            <h4>Controle de corredor League of Legends</h4>
          </div>
        </div>
      </section>
    </Layout>
  )
}
