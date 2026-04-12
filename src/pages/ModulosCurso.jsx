// ============================================================
// ModulosCurso.jsx
// Exibe os módulos de UM curso específico.
// A rota é /cursos/:cursoId — o :cursoId vem da URL.
// Ex: /cursos/1 → módulos do Fortnite
//     /cursos/2 → módulos do League of Legends
// ============================================================

import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useParams, useNavigate } from 'react-router-dom'
import {
  fetchCursos,
  fetchModulosDoCurso,
  setModuloStatusCurso,
  limparModulosCurso,
} from '../store/cursosSlice'
import Layout from '../components/Layout'
import Modal  from '../components/Modal'
import Toast  from '../components/Toast'
import './ModulosCurso.css'

export default function ModulosCurso() {
  // Pega o :cursoId diretamente da URL (ex: "1", "2", "3"...)
  const { cursoId } = useParams()

  const dispatch = useDispatch()
  const navigate = useNavigate()

  // Lê do estado global do Redux:
  //   cursos          → lista de cursos (para mostrar nome/descrição do curso atual)
  //   modulosDosCurso → módulos filtrados do curso aberto
  //   modulosStatus   → status da requisição dos módulos
  const { items: cursos, modulosDosCurso, modulosStatus } = useSelector(s => s.cursos)

  // Estado local para controlar qual módulo está sendo exibido no modal
  const [modalModulo, setModalModulo] = useState(null)

  // Estado local para exibir a notificação de ação concluída
  const [toast, setToast] = useState(null)

  // Encontra o objeto do curso atual pela lista de cursos já carregada.
  // Compara string com string pois ambos vêm como texto ("1", "2"...)
  const curso = cursos.find(c => c.id === cursoId)

  // useEffect roda toda vez que o cursoId muda na URL.
  // Isso acontece quando o usuário troca de curso diretamente.
  useEffect(() => {
    // Se a lista de cursos ainda não foi carregada (ex: usuário acessou
    // a URL diretamente sem passar pela tela de cursos), busca agora
    if (!cursos.length) dispatch(fetchCursos())

    // Limpa os módulos do curso anterior para não mostrar dados antigos
    // enquanto os novos estão carregando
    dispatch(limparModulosCurso())

    // Busca os módulos do curso com o id da URL
    dispatch(fetchModulosDoCurso(cursoId))
  }, [dispatch, cursoId])  // re-executa se o cursoId mudar

  // Chamada quando o usuário clica em "Iniciar" ou "Marcar como concluído"
  // novoStatus pode ser: 'in-progress' ou 'completed'
  function handleAcao(modulo, novoStatus) {
    // Envia o PATCH para a API e atualiza o estado local
    dispatch(setModuloStatusCurso({ id: modulo.id, status: novoStatus }))
    setModalModulo(null)  // fecha o modal
    // Mostra notificação temporária de confirmação
    setToast(novoStatus === 'completed' ? 'Módulo concluído!' : 'Módulo iniciado!')
  }

  return (
    <Layout>

      {/* Cabeçalho: botão de voltar + título do curso */}
      <div className="mc-header">
        {/* Botão que leva o usuário de volta à lista de cursos */}
        <button className="btn-voltar" onClick={() => navigate('/')}>
          ← Voltar aos cursos
        </button>
        <div>
          {/* Mostra o nome do curso. Se ainda não carregou, exibe "Carregando..." */}
          <h1 className="title">{curso ? curso.titulo : 'Carregando...'}</h1>
          {/* Descrição só aparece quando o curso já foi encontrado */}
          {curso && <p className="mc-subtitle">{curso.descricao}</p>}
        </div>
      </div>

      {/* Mensagem de carregamento enquanto os módulos chegam da API */}
      {modulosStatus === 'loading' && <p className="loading-msg">Carregando módulos...</p>}

      {/* Grade de cards — um card por módulo do curso */}
      <div className="module-grid">
        {modulosDosCurso.map(mod => (
          // Ao clicar no card, abre o modal com as ações daquele módulo
          <div
            className="module-card"
            key={mod.id}
            onClick={() => setModalModulo(mod)}
          >
            {/* Imagem de capa do módulo */}
            <div className="module-image">
              <img
                src={`/img/${mod.imagem}`}
                alt={mod.titulo}
                onError={e => e.target.style.display = 'none'}
              />
            </div>

            <h3>{mod.titulo}</h3>
            <p>{mod.descricao}</p>

            {/* Badge de status só aparece se o módulo já foi iniciado ou concluído.
                Módulos "locked" (não iniciados) não mostram badge */}
            {mod.status !== 'locked' && (
              <span className={`module-badge module-badge--${mod.status}`}>
                {mod.status === 'completed' ? '✓ Concluído' : '▶ Em andamento'}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Modal — aparece quando o usuário clica num card de módulo */}
      {modalModulo && (
        <Modal onClose={() => setModalModulo(null)}>

          {/* Cabeçalho do modal: nome do módulo + badge de status */}
          <div className="compt-modal-header">
            <h3>{modalModulo.titulo}</h3>
            <span className={`modal-status-label modal-status--${modalModulo.status}`}>
              {modalModulo.status === 'locked'
                ? 'Não iniciado'
                : modalModulo.status === 'in-progress'
                ? 'Em andamento'
                : 'Concluído'}
            </span>
          </div>

          <p className="compt-modal-sub">Gerencie seu progresso neste módulo.</p>

          {/* Botões de ação — mudam conforme o status atual do módulo */}
          <div className="compt-modal-actions">

            {/* Módulo ainda não iniciado → botão para iniciar */}
            {modalModulo.status === 'locked' && (
              <button className="btn-primary" onClick={() => handleAcao(modalModulo, 'in-progress')}>
                ▶ Iniciar módulo
              </button>
            )}

            {/* Módulo em andamento → botão para marcar como concluído */}
            {modalModulo.status === 'in-progress' && (
              <button className="btn-primary" onClick={() => handleAcao(modalModulo, 'completed')}>
                ✓ Marcar como concluído
              </button>
            )}

            {/* Módulo já concluído → só exibe uma mensagem, sem botão de ação */}
            {modalModulo.status === 'completed' && (
              <p className="mod-done-msg">✓ Módulo já concluído!</p>
            )}

            <button className="btn-secondary" onClick={() => setModalModulo(null)}>
              Fechar
            </button>
          </div>

        </Modal>
      )}

      {/* Toast — notificação que some automaticamente após alguns segundos */}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}

    </Layout>
  )
}
