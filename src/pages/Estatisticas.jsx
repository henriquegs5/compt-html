import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchEstatisticas } from '../store/estatisticasSlice'
import Layout from '../components/Layout'
import './Estatisticas.css'

export default function Estatisticas() {
  const dispatch = useDispatch()
  const { items, status } = useSelector(s => s.estatisticas)

  useEffect(() => {
    if (status === 'idle' || status === 'failed') dispatch(fetchEstatisticas())
  }, [dispatch, status])

  return (
    <Layout>
      <h1 className="title">Estatísticas</h1>

      {status === 'loading' && <p className="loading-msg">Carregando estatísticas...</p>}

      {status === 'succeeded' && items.length === 0 && (
        <p className="loading-msg">Você ainda não está matriculado em nenhum curso com estatísticas.</p>
      )}

      <div className="stats-grid">
        {items.map(curso => (
          <div className="game-stats" key={curso.cursoId}>
            <div className="game-header">
              <img src={`/img/${curso.imagem}`} alt={curso.titulo} onError={e => e.target.style.display='none'} />
              <h3>{curso.titulo}</h3>
            </div>

            {curso.rankingMethods.length > 0 && (
              <div className="stats-list">
                {curso.rankingMethods.map(rm => {
                  const userStat = curso.stats.find(s => s.nome === rm.nome)
                  return (
                    <div key={rm.nome}>
                      <p>{rm.nome}</p>
                      <strong>{userStat?.valor || '—'}</strong>
                    </div>
                  )
                })}
              </div>
            )}

            {curso.rankingMethods.length === 0 && (
              <p className="chat-empty" style={{ textAlign: 'center', marginTop: '1rem' }}>
                Este curso não possui formas de rankeamento.
              </p>
            )}
          </div>
        ))}
      </div>
    </Layout>
  )
}
