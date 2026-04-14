// ============================================================
// ModulosCurso.jsx
// Exibe os módulos de UM curso específico.
// A rota é /cursos/:cursoId — o :cursoId vem da URL.
// Ex: /cursos/1 → módulos do Fortnite
//     /cursos/2 → módulos do League of Legends
//
// Funcionalidades de admin/moderador:
//   - Card "+" no final da grade para adicionar novos módulos
//   - Botão ✏️ em cada card para editar/excluir o módulo
// ============================================================

import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useParams, useNavigate } from 'react-router-dom'
import {
  fetchCursos,
  fetchModulosDoCurso,
  setModuloStatusCurso,
  limparModulosCurso,
  adicionarModulo,
  editarModulo,
  excluirModulo,
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

  // Usuário logado — usado para controle de permissão (admin/moderador)
  const usuario = useSelector(s => s.auth.usuario)
  const podeGerenciar = usuario?.role === 'admin' || usuario?.role === 'moderador'

  // Estado local para controlar qual módulo está sendo exibido no modal de progresso
  const [modalModulo, setModalModulo] = useState(null)

  // Estado local para exibir a notificação de ação concluída
  const [toast, setToast] = useState(null)

  // ---- Estados do modal de criação/edição (admin/moderador) ----

  // Controla a abertura do modal de formulário (criar/editar módulo)
  const [modalFormAberto, setModalFormAberto] = useState(false)

  // id do módulo em edição — null significa modo de criação
  const [moduloEditandoId, setModuloEditandoId] = useState(null)

  // Campos do formulário (novo módulo ou módulo sendo editado).
  // O campo "link" é opcional — guarda uma URL de referência
  // (vídeo, material externo, etc.) que aparece no modal de progresso.
  const [formModulo, setFormModulo] = useState({
    titulo: '',
    descricao: '',
    imagem: '',
    link: '',
  })

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

    // Define a mensagem do toast dependendo da ação
    let msg = 'Status atualizado!'
    if (novoStatus === 'completed') msg = 'Módulo concluído!'
    else if (modulo.status === 'completed' && novoStatus === 'in-progress') msg = 'Conclusão desfeita!'
    else if (novoStatus === 'in-progress') msg = 'Módulo iniciado!'

    setToast(msg)
  }

  // ---- Handlers do modal de criação/edição ----

  // Abre o modal em modo CRIAÇÃO (sem id preenchido)
  function abrirModalCriar() {
    setFormModulo({ titulo: '', descricao: '', imagem: '', link: '' })
    setModuloEditandoId(null)
    setModalFormAberto(true)
  }

  // Abre o modal em modo EDIÇÃO com os dados do módulo pré-preenchidos.
  // Recebe o evento para poder chamar stopPropagation, impedindo
  // que o clique no ✏️ abra também o modal de progresso do card.
  function abrirModalEditar(e, modulo) {
    e.stopPropagation()
    setFormModulo({
      titulo: modulo.titulo,
      descricao: modulo.descricao,
      imagem: modulo.imagem,
      // || '' garante que o campo fique vazio se o módulo antigo
      // ainda não tiver o campo link salvo no banco
      link: modulo.link || '',
    })
    setModuloEditandoId(modulo.id)
    setModalFormAberto(true)
  }

  // Atualiza o campo correspondente do formulário conforme o usuário digita
  function handleFormChange(e) {
    const { name, value } = e.target
    setFormModulo(prev => ({ ...prev, [name]: value }))
  }

  // Envia o formulário — decide entre criar ou editar pelo moduloEditandoId
  function handleFormSubmit(e) {
    e.preventDefault()
    if (!formModulo.titulo.trim() || !formModulo.descricao.trim()) {
      alert('Preencha o título e a descrição do módulo.')
      return
    }

    if (moduloEditandoId) {
      // Edição: PATCH no módulo existente
      dispatch(editarModulo({ id: moduloEditandoId, ...formModulo }))
      setToast('Módulo atualizado!')
    } else {
      // Criação: POST novo módulo associado ao cursoId atual (vindo da URL)
      dispatch(adicionarModulo({ cursoId, ...formModulo }))
      setToast('Módulo adicionado!')
    }

    setModalFormAberto(false)
  }

  // Exclui o módulo em edição — pede confirmação antes
  function handleExcluir() {
    if (!moduloEditandoId) return
    const confirmar = window.confirm(
      'Tem certeza que deseja excluir este módulo? Esta ação não pode ser desfeita.'
    )
    if (!confirmar) return

    dispatch(excluirModulo(moduloEditandoId))
    setModalFormAberto(false)
    setToast('Módulo excluído!')
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

      <input type="text" className="page-search" placeholder="Pesquisar módulo..." style={{ marginTop: '1.5rem' }} />
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
            {/* Botão de editar — só visível para admin/moderador.
                stopPropagation evita que o clique abra também o modal
                de progresso do card. */}
            {podeGerenciar && (
              <button
                className="btn-editar-modulo"
                onClick={(e) => abrirModalEditar(e, mod)}
                title="Editar módulo"
              >
                ✏️
              </button>
            )}

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

        {/* Card "+" para adicionar um novo módulo — só admin/moderador */}
        {podeGerenciar && (
          <button
            type="button"
            className="module-card module-card--adicionar"
            onClick={abrirModalCriar}
            title="Adicionar novo módulo"
          >
            <span className="module-adicionar-icone">+</span>
            <span className="module-adicionar-texto">Adicionar módulo</span>
          </button>
        )}
      </div>

      {/* Modal de progresso — aparece quando o usuário clica num card de módulo */}
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

          {/* Link de referência do módulo — só aparece se tiver sido informado.
              target="_blank" abre em nova aba para não sair do app.
              rel="noopener noreferrer" é uma boa prática de segurança: impede
              que a página aberta acesse/manipule a aba original. */}
          {modalModulo.link && (
            <a
              href={modalModulo.link}
              target="_blank"
              rel="noopener noreferrer"
              className="modal-link"
            >
              🔗 Abrir material do módulo
            </a>
          )}

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

            {/* Módulo já concluído → mensagem e botão para desfazer */}
            {modalModulo.status === 'completed' && (
              <>
                <p className="mod-done-msg">✓ Módulo concluído!</p>
                <button className="btn-secondary" style={{ borderColor: 'var(--error)', color: 'var(--error)' }} onClick={() => handleAcao(modalModulo, 'in-progress')}>
                  Desfazer conclusão
                </button>
              </>
            )}

            <button className="btn-secondary" onClick={() => setModalModulo(null)}>
              Fechar
            </button>
          </div>

        </Modal>
      )}

      {/* Modal de criação/edição de módulo — só abre via botão "+" ou ✏️.
          Reutilizado para ambos os modos (como fizemos na tela de cursos). */}
      {modalFormAberto && (
        <Modal onClose={() => setModalFormAberto(false)}>
          <h2 className="modal-titulo">
            {moduloEditandoId ? 'Editar módulo' : 'Adicionar novo módulo'}
          </h2>
          <form className="curso-form" onSubmit={handleFormSubmit}>
            <label>
              Título
              <input
                type="text"
                name="titulo"
                value={formModulo.titulo}
                onChange={handleFormChange}
                placeholder="Ex: Módulo 1 - Fundamentos"
                required
              />
            </label>

            <label>
              Descrição
              <textarea
                name="descricao"
                value={formModulo.descricao}
                onChange={handleFormChange}
                placeholder="Breve descrição do módulo..."
                rows={3}
                required
              />
            </label>

            <label>
              Imagem (arquivo em /public/img)
              <input
                type="text"
                name="imagem"
                value={formModulo.imagem}
                onChange={handleFormChange}
                placeholder="Ex: fortnite.jpg"
              />
            </label>

            {/* Campo de link opcional — URL externa de referência do módulo.
                Pode ser um vídeo do YouTube, documento, artigo, etc.
                type="url" faz o navegador validar que é uma URL válida. */}
            <label>
              Link (opcional)
              <input
                type="url"
                name="link"
                value={formModulo.link}
                onChange={handleFormChange}
                placeholder="https://exemplo.com/video-do-modulo"
              />
            </label>

            <div className="curso-form-acoes">
              {/* Botão excluir — só aparece em modo edição */}
              {moduloEditandoId && (
                <button type="button" className="btn-excluir" onClick={handleExcluir}>
                  Excluir módulo
                </button>
              )}

              <div className="curso-form-spacer" />

              <button type="button" className="btn-cancelar" onClick={() => setModalFormAberto(false)}>
                Cancelar
              </button>
              <button type="submit" className="btn-salvar">
                {moduloEditandoId ? 'Salvar alterações' : 'Salvar módulo'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Toast — notificação que some automaticamente após alguns segundos */}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}

    </Layout>
  )
}
