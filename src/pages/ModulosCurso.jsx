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

import { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useParams, useNavigate } from 'react-router-dom'
import {
  fetchCursos,
  fetchCursosMatriculados,
  fetchProgressoDoCurso,
  setModuloStatusCurso,
  limparModulosCurso,
  adicionarModulo,
  editarModulo,
  excluirModulo,
  selectAllCursos,
  selectAllModulosDoCurso,
  fetchReviews,
  enviarReview,
  selectAllReviews,
  fetchModulosDoCurso,
} from '../store/cursosSlice'
import Layout from '../components/Layout'
import Modal  from '../components/Modal'
import Toast  from '../components/Toast'
import Chat   from '../components/Chat'
import { youtubeEmbedUrl, youtubeThumbnail } from '../utils/youtube'
import { fetchEstatisticas, salvarEstatisticas } from '../store/estatisticasSlice'
import './ModulosCurso.css'
import './ModulosCurso-extras.css'

// Resolve a imagem de capa de um módulo:
//  - se "usarThumbnail" estiver marcado e houver vídeo do YouTube, usa a
//    thumbnail do próprio vídeo
//  - caso contrário, usa a imagem da pasta /img (escondida pelo onError se
//    o arquivo não existir)
function srcImagemModulo(mod) {
  if (mod.usarThumbnail) {
    const thumb = youtubeThumbnail(mod.link)
    if (thumb) return thumb
  }
  return `/img/${mod.imagem}`
}

export default function ModulosCurso() {
  // Pega o :cursoId diretamente da URL (ex: "1", "2", "3"...)
  const { cursoId } = useParams()

  const dispatch = useDispatch()
  const navigate = useNavigate()

  // selectAllCursos e selectAllModulosDoCurso são gerados pelo EntityAdapter
  // e convertem o estado normalizado { ids, entities } em um array simples
  const cursos        = useSelector(selectAllCursos)
  const modulosBrutos = useSelector(selectAllModulosDoCurso)
  const modulosStatus = useSelector(s => s.cursos.modulosDosCurso.status)
  const progressoDosModulos = useSelector(s => s.cursos.progressoDosModulos)
  
  const matriculados = useSelector(s => s.cursos.matriculados)
  const matriculadosStatus = useSelector(s => s.cursos.matriculadosStatus)

  const reviews = useSelector(selectAllReviews)
  const reviewsStatus = useSelector(s => s.cursos.reviews.status)

  // Encontra o objeto do curso atual pela lista de cursos já carregada.
  // Compara string com string pois ambos vêm como texto ("1", "2"...)
  const curso = cursos.find(c => c.id === cursoId)

  // Sobrepõe o progresso do usuário em cada módulo: o status exibido vem do
  // progresso pessoal; se o usuário ainda não mexeu no módulo, fica 'locked'.
  // Assim o status deixa de ser global e passa a ser por usuário.
  const modulosDosCurso = modulosBrutos.map(m => ({
    ...m,
    status: progressoDosModulos[m.id] ?? 'locked',
  }))

  // Usuário logado — usado para controle de permissão (admin/moderador)
  const usuario = useSelector(s => s.auth.usuario)
  const isAdMod = usuario?.role === 'admin' || usuario?.role === 'moderador'
  const podeGerenciar = usuario && curso && (
    usuario.role === 'admin' ||                  // admin gerencia qualquer curso
    curso.criadorId === usuario.id ||            // criador gerencia o próprio
    (!curso.criadorId && isAdMod)                // curso sem criador: admin/mod
  );

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
    usarThumbnail: false,
  })

  // ---- Estados para avaliações ----
  const [reviewForm, setReviewForm] = useState({ nota: 0, texto: '' })
  const [hoverStar, setHoverStar] = useState(0)

  // ---- Estados para edição de estatísticas do curso ----
  const cursosStats = useSelector(s => s.estatisticas.items)
  const [cursoStats, setCursoStats] = useState([])
  const initRef = useRef(null)

  useEffect(() => {
    if (curso?.rankingMethods?.length > 0 && initRef.current !== curso.id) {
      const existente = cursosStats.find(c => c.cursoId === cursoId)
      setCursoStats(
        curso.rankingMethods.map(rm => {
          const stat = existente?.stats?.find(s => s.nome === rm.nome)
          return { nome: rm.nome, valor: stat?.valor || '', publico: stat?.publico ?? false }
        })
      )
      initRef.current = curso.id
    }
  }, [curso, cursosStats, cursoId])

  // useEffect roda toda vez que o cursoId muda na URL.
  // Isso acontece quando o usuário troca de curso diretamente.
  useEffect(() => {
    // Se a lista de cursos ainda não foi carregada (ex: usuário acessou
    // a URL diretamente sem passar pela tela de cursos), busca agora
    if (!cursos.length) dispatch(fetchCursos())

    // Limpa os módulos do curso anterior para não mostrar dados antigos
    // enquanto os novos estão carregando
    dispatch(limparModulosCurso())

    if (usuario) {
      dispatch(fetchProgressoDoCurso(cursoId))
    }

    // Busca os módulos do curso com o id da URL
    dispatch(fetchModulosDoCurso(cursoId))
    // Busca as reviews do curso
    dispatch(fetchReviews(cursoId))
    // Busca as estatísticas do usuário para todos os cursos
    dispatch(fetchEstatisticas())
  }, [dispatch, cursoId])  // re-executa se o cursoId mudar

  useEffect(() => {
    if (usuario && matriculadosStatus === 'idle') {
      dispatch(fetchCursosMatriculados())
    }
  }, [dispatch, usuario, matriculadosStatus])

  useEffect(() => {
    // Se a lista de cursos e matriculas já foram carregadas:
    if (cursos.length > 0 && matriculadosStatus === 'succeeded' && curso) {
      if (curso.pago && !podeGerenciar && !matriculados.includes(cursoId)) {
        // Redireciona para pagamento se for pago e não matriculado e não for admin/moderador
        navigate(`/pagamento/${cursoId}`, { replace: true })
      }
    }
  }, [cursos, matriculadosStatus, matriculados, curso, podeGerenciar, cursoId, navigate])

  useEffect(() => {
    if (usuario && reviews.length > 0) {
      const minhaReview = reviews.find(r => r.userId === usuario.id)
      if (minhaReview) {
        setReviewForm({ nota: minhaReview.nota, texto: minhaReview.texto || '' })
      }
    }
  }, [reviews, usuario])

  // Chamada quando o usuário clica em "Iniciar" ou "Marcar como concluído"
  // novoStatus pode ser: 'in-progress' ou 'completed'
  function handleAcao(modulo, novoStatus) {
    if (!usuario) {
      alert('Você precisa fazer login para salvar o progresso.')
      navigate('/login')
      return
    }

    const statusAtual = progressoDosModulos[modulo.id] || 'locked'

    // Envia o POST para a API e atualiza o estado local
    dispatch(setModuloStatusCurso({ id: modulo.id, status: novoStatus, cursoId }))
    setModalModulo(null)  // fecha o modal

    // Define a mensagem do toast dependendo da ação
    let msg = 'Status atualizado!'
    if (novoStatus === 'completed') msg = 'Módulo concluído!'
    else if (statusAtual === 'completed' && novoStatus === 'in-progress') msg = 'Conclusão desfeita!'
    else if (novoStatus === 'in-progress') msg = 'Módulo iniciado!'

    setToast(msg)
  }

  // ---- Handlers do modal de criação/edição ----

  // Abre o modal em modo CRIAÇÃO (sem id preenchido)
  function abrirModalCriar() {
    setFormModulo({ titulo: '', descricao: '', imagem: '', link: '', usarThumbnail: false })
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
      usarThumbnail: modulo.usarThumbnail || false,
    })
    setModuloEditandoId(modulo.id)
    setModalFormAberto(true)
  }

  // Atualiza o campo correspondente do formulário conforme o usuário digita
  function handleFormChange(e) {
    const { name, value, type, checked } = e.target
    setFormModulo(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  // Envia o formulário — decide entre criar ou editar pelo moduloEditandoId
  function handleFormSubmit(e) {
    e.preventDefault()
    if (!formModulo.titulo.trim() || !formModulo.descricao.trim()) {
      alert('Preencha o título e a descrição do módulo.')
      return
    }

    if (moduloEditandoId) {
      dispatch(editarModulo({ id: moduloEditandoId, ...formModulo }))
      setToast('Módulo atualizado!')
    } else {
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

  // Handle Review Submit
  function handleReviewSubmit(e) {
    e.preventDefault()
    if (reviewForm.nota === 0) {
      alert('Por favor, selecione uma nota de 1 a 5 estrelas.')
      return
    }
    dispatch(enviarReview({ cursoId, ...reviewForm }))
    setToast('Avaliação salva com sucesso!')
  }

  function handleStatChange(nome, valor) {
    setCursoStats(prev => prev.map(s => s.nome === nome ? { ...s, valor } : s))
  }

  function handleStatToggle(nome) {
    setCursoStats(prev => prev.map(s => s.nome === nome ? { ...s, publico: !s.publico } : s))
  }

  function handleSalvarStats() {
    const stats = cursoStats.filter(s => s.valor.trim())
    if (stats.length === 0) return
    dispatch(salvarEstatisticas({ cursoId, stats }))
    setToast('Estatísticas salvas!')
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
                src={srcImagemModulo(mod)}
                alt={mod.titulo}
                onLoad={e => e.target.style.display = ''}
                onError={e => e.target.style.display = 'none'}
              />
            </div>

            <h3>{mod.titulo}</h3>
            <p>{mod.descricao}</p>

            {/* Badge de status só aparece se o módulo já foi iniciado ou concluído.
                Módulos "locked" (não iniciados) não mostram badge */}
            {(progressoDosModulos[mod.id] && progressoDosModulos[mod.id] !== 'locked') && (
              <span className={`module-badge module-badge--${progressoDosModulos[mod.id]}`}>
                {progressoDosModulos[mod.id] === 'completed' ? '✓ Concluído' : '▶ Em andamento'}
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

      {/* --- CHAT DO CURSO --- só aparece se um canal foi configurado no curso */}
      {curso?.chat && (
        <div className="curso-chat-section">
          <h2>💬 Chat do curso</h2>
          <Chat canal={curso.chat} />
        </div>
      )}

      {/* --- SEÇÃO DE AVALIAÇÕES --- */}
      <div className="reviews-section">
        <div className="reviews-header">
          <h2>Avaliações do Curso</h2>
          <div className="reviews-summary">
            <span className="reviews-avg-star">★ {curso?.mediaAvaliacoes ? curso.mediaAvaliacoes.toFixed(1) : '0.0'}</span>
            <span className="reviews-count">({curso?.totalAvaliacoes || 0} avaliações)</span>
          </div>
        </div>

        {usuario && !podeGerenciar ? (
          <form className="review-form" onSubmit={handleReviewSubmit}>
            <h3>Sua avaliação</h3>
            <div className="star-rating">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  type="button"
                  key={star}
                  className={`star-btn ${(hoverStar || reviewForm.nota) >= star ? 'star-active' : ''}`}
                  onClick={() => setReviewForm(prev => ({ ...prev, nota: star }))}
                  onMouseEnter={() => setHoverStar(star)}
                  onMouseLeave={() => setHoverStar(0)}
                >
                  ★
                </button>
              ))}
            </div>
            <textarea
              placeholder="O que você achou do curso? (opcional)"
              value={reviewForm.texto}
              onChange={e => setReviewForm(prev => ({ ...prev, texto: e.target.value }))}
              rows="3"
            />
            <button type="submit" className="btn-primary btn-submit-review">
              Salvar Avaliação
            </button>
          </form>
        ) : !usuario ? (
          <p className="review-login-msg">Faça login para avaliar este curso.</p>
        ) : null}

        <div className="reviews-list">
          {reviewsStatus === 'loading' && <p>Carregando avaliações...</p>}
          {reviewsStatus === 'succeeded' && reviews.length === 0 && (
            <p className="no-reviews">Este curso ainda não tem avaliações. Seja o primeiro a avaliar!</p>
          )}
          {reviews.map(review => (
            <div key={review.id} className="review-card">
              <div className="review-card-header">
                <span className="review-user">{review.userName}</span>
                <span className="review-date">
                  {new Date(review.criadoEm).toLocaleDateString('pt-BR')}
                </span>
              </div>
              <div className="review-stars">
                {'★'.repeat(review.nota)}{'☆'.repeat(5 - review.nota)}
              </div>
              {review.texto && <p className="review-text">{review.texto}</p>}
            </div>
          ))}
        </div>
      </div>

      {/* Modal de progresso — aparece quando o usuário clica num card de módulo */}
      {modalModulo && (
        <Modal onClose={() => setModalModulo(null)}>

          {/* Cabeçalho do modal: nome do módulo + badge de status */}
          <div className="compt-modal-header">
            <h3>{modalModulo.titulo}</h3>
            <span className={`modal-status-label modal-status--${progressoDosModulos[modalModulo.id] || 'locked'}`}>
              {(progressoDosModulos[modalModulo.id] || 'locked') === 'locked'
                ? 'Não iniciado'
                : progressoDosModulos[modalModulo.id] === 'in-progress'
                ? 'Em andamento'
                : 'Concluído'}
            </span>
          </div>

          <p className="compt-modal-sub">Gerencie seu progresso neste módulo.</p>

          {/* Se o link for um vídeo do YouTube, toca embutido aqui no modal.
              Caso seja outro tipo de link (artigo, PDF...), cai no <a> abaixo. */}
          {youtubeEmbedUrl(modalModulo.link) ? (
            <div className="modal-video">
              <iframe
                src={youtubeEmbedUrl(modalModulo.link)}
                title={modalModulo.titulo}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : modalModulo.link && (
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
            {(progressoDosModulos[modalModulo.id] || 'locked') === 'locked' && (
              <button className="btn-primary" onClick={() => handleAcao(modalModulo, 'in-progress')}>
                ▶ Iniciar módulo
              </button>
            )}

            {/* Módulo em andamento → botão para marcar como concluído */}
            {progressoDosModulos[modalModulo.id] === 'in-progress' && (
              <button className="btn-primary" onClick={() => handleAcao(modalModulo, 'completed')}>
                ✓ Marcar como concluído
              </button>
            )}

            {/* Módulo já concluído → mensagem e botão para desfazer */}
            {progressoDosModulos[modalModulo.id] === 'completed' && (
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
              Link / vídeo do YouTube (opcional)
              <input
                type="url"
                name="link"
                value={formModulo.link}
                onChange={handleFormChange}
                placeholder="https://youtube.com/watch?v=... (toca no módulo)"
              />
            </label>

            {/* Só faz sentido oferecer a thumbnail quando há um vídeo válido */}
            {youtubeEmbedUrl(formModulo.link) && (
              <label className="modulo-thumb-check">
                <input
                  type="checkbox"
                  name="usarThumbnail"
                  checked={formModulo.usarThumbnail}
                  onChange={handleFormChange}
                />
                Usar a thumbnail do vídeo como imagem do módulo
              </label>
            )}

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

      {/* --- SEÇÃO DE ESTATÍSTICAS DO CURSO --- */}
      {curso?.rankingMethods?.length > 0 && (
        <div className="curso-stats-section">
          <h2>📊 Estatísticas</h2>
          <p className="curso-stats-sub">Preencha suas estatísticas para este curso.</p>
          <div className="curso-stats-grid">
            {cursoStats.map(stat => (
              <div className="curso-stat-field" key={stat.nome}>
                <label className="curso-stat-label">{stat.nome}</label>
                <div className="curso-stat-row">
                  <input
                    type="text"
                    className="curso-stat-input"
                    value={stat.valor}
                    onChange={e => handleStatChange(stat.nome, e.target.value)}
                    placeholder={`Seu ${stat.nome.toLowerCase()}...`}
                    maxLength={30}
                  />
                  <label className="curso-stat-toggle">
                    <input
                      type="checkbox"
                      checked={stat.publico}
                      onChange={() => handleStatToggle(stat.nome)}
                    />
                    <span>{stat.publico ? 'Público' : 'Privado'}</span>
                  </label>
                </div>
              </div>
            ))}
          </div>
          <button className="btn-salvar" onClick={handleSalvarStats}>
            Salvar estatísticas
          </button>
        </div>
      )}

      {/* Toast — notificação que some automaticamente após alguns segundos */}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}

    </Layout>
  )
}
