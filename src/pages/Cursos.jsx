// ============================================================
// Cursos.jsx
// Tela inicial após o login — exibe todos os cursos disponíveis
// em cards. Ao clicar em "Abrir curso" o usuário é levado para
// a página de módulos daquele curso específico.
// ============================================================

import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { fetchCursos } from '../store/cursosSlice'
import Layout from '../components/Layout'
import './Cursos.css'

export default function Cursos() {
  // dispatch envia ações para o Redux (ex: buscar dados, atualizar estado)
  const dispatch = useDispatch()

  // navigate troca de página sem recarregar o site (Single Page App)
  const navigate = useNavigate()

  // Lê do estado global do Redux:
  //   items  → lista de cursos já carregados
  //   status → 'idle' | 'loading' | 'succeeded' | 'failed'
  const { items, status } = useSelector(s => s.cursos)

  // useEffect roda quando o componente aparece na tela.
  // Só dispara o fetch se ainda não buscamos os cursos (status === 'idle'),
  // evitando requisições duplicadas ao voltar para esta página.
  useEffect(() => {
    if (status === 'idle') dispatch(fetchCursos())
  }, [dispatch, status])

  return (
    <Layout>
      {/* Títulos da página */}
      <h1 className="title">Cursos Disponíveis</h1>
      <p className="subtitle">Escolha um curso para ver os módulos</p>

      {/* Exibe mensagem de carregamento enquanto os dados chegam da API */}
      {status === 'loading' && <p className="loading-msg">Carregando cursos...</p>}

      {/* Grade de cards — um card por curso */}
      <div className="cursos-grid">
        {items.map(curso => (
          <div className="curso-card" key={curso.id}>

            {/* Área da imagem de capa do curso */}
            <div className="curso-image">
              <img
                src={`/img/${curso.imagem}`}
                alt={curso.titulo}
                // Se a imagem não existir, esconde o elemento sem quebrar o layout
                onError={e => e.target.style.display = 'none'}
              />
              {/* Gradiente escuro sobre a imagem para melhorar leitura do texto */}
              <div className="curso-overlay" />
            </div>

            {/* Corpo do card: título, descrição e rodapé */}
            <div className="curso-body">
              <h2 className="curso-titulo">{curso.titulo}</h2>
              <p className="curso-descricao">{curso.descricao}</p>

              <div className="curso-footer">
                {/* Mostra quantos módulos o curso tem */}
                <span className="curso-modulos-count">
                  {curso.totalModulos} módulos
                </span>

                {/* Ao clicar, navega para /cursos/[id do curso]
                    ex: /cursos/1 → módulos do Fortnite */}
                <button
                  className="btn-abrir-curso"
                  onClick={() => navigate(`/cursos/${curso.id}`)}
                >
                  Abrir curso
                </button>
              </div>
            </div>

          </div>
        ))}
      </div>
    </Layout>
  )
}
