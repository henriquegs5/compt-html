import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { 
  fetchCursos, 
  fetchCursosMatriculados, 
  fetchProgressoGeral,
  selectAllCursos 
} from '../store/cursosSlice'
import Layout from '../components/Layout'
import { srcImagemCurso } from '../utils/imagemCurso'
import './Progressos.css'

export default function Progressos() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  
  const cursos = useSelector(selectAllCursos)
  const status = useSelector(s => s.cursos.status)
  const matriculados = useSelector(s => s.cursos.matriculados)
  const matriculadosStatus = useSelector(s => s.cursos.matriculadosStatus)
  const progressoGeral = useSelector(s => s.cursos.progressoGeral)
  const progressoStatus = useSelector(s => s.cursos.progressoGeralStatus)
  const usuario = useSelector(s => s.auth.usuario)

  useEffect(() => { 
    if (status === 'idle') dispatch(fetchCursos())
    if (usuario && matriculadosStatus === 'idle') dispatch(fetchCursosMatriculados())
    if (usuario && progressoStatus === 'idle') dispatch(fetchProgressoGeral())
  }, [dispatch, status, matriculadosStatus, progressoStatus, usuario])

  // Filtra apenas os cursos em que o usuário está matriculado
  const meusCursos = cursos.filter(c => matriculados.includes(c.id))

  // Calcula estatísticas gerais
  let totalModulosCompletosGlobais = 0
  let totalModulosEmAndamentoGlobais = 0

  progressoGeral.forEach(p => {
    if (p.status === 'completed') totalModulosCompletosGlobais++
    if (p.status === 'in-progress') totalModulosEmAndamentoGlobais++
  })
  return (
    <Layout>
      <h1 className="title">Meus progressos</h1>

      {/* Resumo Geral */}
      <section className="progress-summary">
        <div className="progress-stats">
          <div className="stat-card">
            <h3>{totalModulosCompletosGlobais}</h3>
            <p>Módulos completos</p>
          </div>
          <div className="stat-card">
            <h3>{totalModulosEmAndamentoGlobais}</h3>
            <p>Módulos iniciados</p>
          </div>
        </div>
      </section>

      {/* Progresso por Curso */}
      <section className="course-progress-section">
        <h2 className="title-small">Cursos Matriculados</h2>
        
        {meusCursos.length === 0 ? (
          <p className="no-courses-msg">Você ainda não está matriculado em nenhum curso.</p>
        ) : (
          <div className="course-progress-grid">
            {meusCursos.map(curso => {
              // Pegar o progresso deste curso específico
              const progressosDesteCurso = progressoGeral.filter(p => p.cursoId === curso.id)
              const completados = progressosDesteCurso.filter(p => p.status === 'completed').length
              
              // Evitar divisão por zero se o curso tiver 0 módulos
              const totalModulos = curso.totalModulos || 1
              const pct = Math.round((completados / totalModulos) * 100)

              return (
                <div key={curso.id} className="course-progress-card" onClick={() => navigate(`/cursos/${curso.id}`)}>
                  <div className="cp-image">
                    <img src={srcImagemCurso(curso.imagem)} alt={curso.titulo} onLoad={e => e.target.style.display=''} onError={e => e.target.style.display='none'} />
                  </div>
                  <div className="cp-content">
                    <h4>{curso.titulo}</h4>
                    <p className="cp-modules-count">{completados} de {curso.totalModulos} módulos concluídos</p>
                    
                    <div className="cp-bar-container">
                      <div className="cp-bar-header">
                        <span>Progresso</span>
                        <span className="cp-pct">{pct}%</span>
                      </div>
                      <div className="cp-bar-bg">
                        <div className="cp-bar-fill" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </Layout>
  )
}
