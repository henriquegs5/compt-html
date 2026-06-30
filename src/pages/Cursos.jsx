import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import {
  fetchCursos,
  fetchCursosMatriculados,
  matricularCurso,
  desmatricularCurso,
  adicionarCurso,
  editarCurso,
  excluirCurso,
  selectAllCursos,
} from '../store/cursosSlice'
import Layout from '../components/Layout'
import Modal from '../components/Modal'
import { IMAGENS_CURSO, srcImagemCurso } from '../utils/imagemCurso'
import './Cursos.css'
import './Cursos-extras.css'

/**
 * Componente de listagem e gerenciamento de Cursos.
 * Permite buscar cursos do servidor, filtrar localmente,
 * criar, editar e excluir (se o usuário for admin).
 * 
 * @component
 * @returns {JSX.Element} Tela de cursos
 */
export default function Cursos() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  // selectAllCursos é gerado pelo EntityAdapter e retorna o array de cursos
  // a partir do estado normalizado { ids: [], entities: {} }
  const items  = useSelector(selectAllCursos)
  const status = useSelector(s => s.cursos.status)
  const matriculados = useSelector(s => s.cursos.matriculados)
  const matriculadosStatus = useSelector(s => s.cursos.matriculadosStatus)
  const usuario = useSelector(s => s.auth.usuario)

  const podeAdicionar = usuario?.role === 'admin' || usuario?.role === 'moderador'

  const [activeTab, setActiveTab] = useState('disponiveis')
  const [modalAberto, setModalAberto] = useState(false)
  const [cursoEditandoId, setCursoEditandoId] = useState(null)
  const [termoPesquisa, setTermoPesquisa] = useState('')
  // id do curso recém-matriculado — abre o modal "ir para o curso?" quando definido
  const [cursoMatriculadoId, setCursoMatriculadoId] = useState(null)
  const [novoCurso, setNovoCurso] = useState({
    titulo: '',
    descricao: '',
    imagem: '',
    pago: false,
    preco: 0,
    horas: 0,
    comChat: false,
    chat: '',
    rankingMethods: []
  })

  useEffect(() => {
    if (status === 'idle') dispatch(fetchCursos())
    if (usuario && matriculadosStatus === 'idle') dispatch(fetchCursosMatriculados())
  }, [dispatch, status, matriculadosStatus, usuario])

  const listaMatriculados = Array.isArray(matriculados) ? matriculados : []

  const cursosPorAba = items.filter(curso => {
    const isMatriculado = listaMatriculados.includes(curso.id)
    if (activeTab === 'matriculados') return isMatriculado
    return !isMatriculado
  })

  const cursosFiltrados = cursosPorAba.filter(curso =>
    curso.titulo.toLowerCase().includes(termoPesquisa.toLowerCase()) ||
    curso.descricao.toLowerCase().includes(termoPesquisa.toLowerCase())
  )

  /**
   * Abre o modal limpo para a criação de um novo curso.
   * @function abrirModal
   */
  function abrirModal() {
    setNovoCurso({ titulo: '', descricao: '', imagem: '', pago: false, preco: 0, horas: 0, comChat: false, chat: '', rankingMethods: [] })
    setCursoEditandoId(null)
    setModalAberto(true)
  }

  /**
   * Abre o modal preenchido com os dados do curso selecionado para edição.
   * @function abrirModalEdicao
   * @param {Object} curso - O objeto de curso a ser editado
   */
  function abrirModalEdicao(curso) {
    setNovoCurso({
      titulo: curso.titulo,
      descricao: curso.descricao,
      imagem: curso.imagem || '',
      pago: curso.pago || false,
      preco: curso.preco || 0,
      horas: curso.horas || 0,
      comChat: !!curso.chat,
      chat: curso.chat || '',
      rankingMethods: curso.rankingMethods ? curso.rankingMethods.map(r => ({ ...r })) : []
    })
    setCursoEditandoId(curso.id)
    setModalAberto(true)
  }

  /**
   * Lida com a mudança dos inputs no formulário.
   * @function handleChange
   * @param {React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement>} e - O evento de mudança
   */
  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setNovoCurso(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  /**
   * Seleciona uma das imagens prontas (arquivo de /public/img) como capa.
   * @function selecionarImagem
   * @param {string} arquivo - Nome do arquivo (ex: "lol.jpg")
   */
  function selecionarImagem(arquivo) {
    setNovoCurso(prev => ({ ...prev, imagem: arquivo }))
  }

  /**
   * Lê a imagem importada do computador e a guarda em base64 (data URL) no
   * campo imagem do curso. Valida tipo (imagem) e tamanho (até 2 MB) para não
   * estourar o limite do corpo da requisição nem o documento no MongoDB.
   * @function handleImagemUpload
   * @param {React.ChangeEvent<HTMLInputElement>} e - Evento do input de arquivo
   */
  function handleImagemUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('Selecione um arquivo de imagem.')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      alert('Imagem muito grande. Escolha uma com até 2 MB.')
      return
    }

    const reader = new FileReader()
    reader.onload = () => setNovoCurso(prev => ({ ...prev, imagem: reader.result }))
    reader.readAsDataURL(file)
  }

  /**
   * Envia o formulário para criar ou editar o curso.
   * @function handleSubmit
   * @param {React.FormEvent} e - O evento de submissão do formulário
   */
  function adicionarRankingMethod() {
    const nome = window.prompt('Nome da forma de rankeamento (ex: Rank, Troféus, K/D):')
    if (!nome || !nome.trim()) return
    setNovoCurso(prev => ({
      ...prev,
      rankingMethods: [...prev.rankingMethods, { nome: nome.trim() }]
    }))
  }

  function removerRankingMethod(index) {
    setNovoCurso(prev => ({
      ...prev,
      rankingMethods: prev.rankingMethods.filter((_, i) => i !== index)
    }))
  }

  async function handleSubmit(e) {
    e.preventDefault()

    if (!novoCurso.titulo.trim() || !novoCurso.descricao.trim()) {
      alert('Preencha o título e a descrição do curso.')
      return
    }

    try {
      // unwrap() faz o thunk relançar o erro aqui caso o backend recuse,
      // permitindo avisar o usuário em vez de fechar o modal silenciosamente.
      if (cursoEditandoId) {
        await dispatch(editarCurso({ id: cursoEditandoId, ...novoCurso })).unwrap()
      } else {
        await dispatch(adicionarCurso(novoCurso)).unwrap()
      }
      setModalAberto(false)
    } catch (err) {
      alert(`Não foi possível salvar o curso: ${err.message || err}`)
    }
  }

  /**
   * Matricula o usuário no curso e, em caso de sucesso, abre o modal
   * perguntando se ele quer ir para o curso ou continuar navegando.
   * @function handleMatricular
   * @param {string} cursoId - ID do curso
   */
  async function handleMatricular(cursoId) {
    if (!usuario) {
      alert('Você precisa fazer login para se matricular.')
      navigate('/login')
      return
    }
    try {
      await dispatch(matricularCurso(cursoId)).unwrap()
      setCursoMatriculadoId(cursoId)
    } catch (err) {
      alert(`Não foi possível matricular: ${err.message || err}`)
    }
  }

  /**
   * Confirma e despacha a ação para excluir um curso existente.
   * @function handleExcluir
   */
  function handleExcluir() {
    if (!cursoEditandoId) return
    const confirmar = window.confirm(
      'Tem certeza que deseja excluir este curso? Esta ação não pode ser desfeita.'
    )
    if (!confirmar) return

    dispatch(excluirCurso(cursoEditandoId))
    setModalAberto(false)
  }

  return (
    <Layout>
      <h1 className="title">Cursos Disponíveis</h1>
      <p className="subtitle">Escolha um curso para ver os módulos</p>

      {usuario && (
        <div className="cursos-tabs">
          <button 
            className={`cursos-tab ${activeTab === 'disponiveis' ? 'cursos-tab--active' : ''}`}
            onClick={() => setActiveTab('disponiveis')}
          >
            Cursos Disponíveis
          </button>
          <button 
            className={`cursos-tab ${activeTab === 'matriculados' ? 'cursos-tab--active' : ''}`}
            onClick={() => setActiveTab('matriculados')}
          >
            Meus Cursos
          </button>
        </div>
      )}

      <input
        type="text"
        className="page-search"
        placeholder="Pesquisar curso..."
        value={termoPesquisa}
        onChange={e => setTermoPesquisa(e.target.value)}
      />

      {status === 'loading' && <p className="loading-msg">Carregando cursos...</p>}

      <div className="cursos-grid">
        {cursosFiltrados.length === 0 && termoPesquisa && (
          <p className="loading-msg">Nenhum curso encontrado para "{termoPesquisa}".</p>
        )}
        {cursosFiltrados.map(curso => {
          const podeEditarCurso = usuario && (
            usuario.role === 'admin' ||                  // admin edita qualquer curso
            curso.criadorId === usuario.id ||            // criador edita o próprio
            (!curso.criadorId && podeAdicionar)          // curso sem criador: admin/mod
          );

          return (
          <div className="curso-card" key={curso.id}>
            <div className="curso-image">
              <img
                src={srcImagemCurso(curso.imagem)}
                alt={curso.titulo}
                // onLoad reexibe a imagem caso ela tenha sido escondida antes:
                // sem isso, um curso sem capa que ganha uma imagem só apareceria
                // após F5, pois o display:none setado no onError ficava no DOM.
                onLoad={e => e.target.style.display = ''}
                onError={e => e.target.style.display = 'none'}
              />
              <div className="curso-overlay" />

              {/* Símbolo de criador: aparece quando o curso foi criado por você */}
              {usuario && curso.criadorId === usuario.id && (
                <span className="curso-criador-badge" title="Você é o criador deste curso">
                  👑 Criador
                </span>
              )}
            </div>

            {podeEditarCurso && (
              <button
                className="btn-editar-curso"
                onClick={() => abrirModalEdicao(curso)}
                title="Editar curso"
              >
                ✏️
              </button>
            )}

            <div className="curso-body">
              {curso.rascunho && <span className="curso-badge curso-badge--rascunho">Rascunho (Vazio)</span>}
              <div className="curso-meta">
                {curso.horas > 0 && <span className="curso-badge curso-badge--horas">⏱ {curso.horas}h</span>}
                <span className="curso-badge curso-badge--rating">
                  ★ {curso.mediaAvaliacoes ? curso.mediaAvaliacoes.toFixed(1) : 'Novo'} 
                  {curso.totalAvaliacoes > 0 && ` (${curso.totalAvaliacoes})`}
                </span>
                {curso.pago ? (
                  <span className="curso-badge curso-badge--pago">R$ {curso.preco.toFixed(2)}</span>
                ) : (
                  <span className="curso-badge curso-badge--gratis">Grátis</span>
                )}
              </div>
              
              <h2 className="curso-titulo">{curso.titulo}</h2>
              <p className="curso-descricao">{curso.descricao}</p>

              <div className="curso-footer">
                <span className="curso-modulos-count">
                  {curso.totalModulos} módulos
                </span>

                {matriculados.includes(curso.id) || podeAdicionar ? (
                  <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
                    <button
                      className="btn-abrir-curso"
                      style={{ flex: 1 }}
                      onClick={() => navigate(`/cursos/${curso.id}`)}
                    >
                      Abrir curso
                    </button>
                    {matriculados.includes(curso.id) && (
                      <button
                        className="btn-abrir-curso"
                        style={{ flex: 0, background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
                        onClick={() => dispatch(desmatricularCurso(curso.id))}
                        title="Cancelar Matrícula"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ) : curso.pago ? (
                  <button
                    className="btn-abrir-curso btn-comprar-curso"
                    onClick={() => {
                      if (!usuario) {
                        alert('Você precisa fazer login para comprar este curso.')
                        navigate('/login')
                      } else {
                        navigate(`/pagamento/${curso.id}`)
                      }
                    }}
                  >
                    Comprar · R$ {curso.preco.toFixed(2)}
                  </button>
                ) : (
                  <button
                    className="btn-abrir-curso btn-matricular-curso"
                    onClick={() => handleMatricular(curso.id)}
                  >
                    Matricular
                  </button>
                )}
              </div>
            </div>
          </div>
        )})}

        {podeAdicionar && activeTab === 'disponiveis' && (
          <button
            type="button"
            className="curso-card curso-card--adicionar"
            onClick={abrirModal}
            title="Adicionar novo curso"
          >
            <span className="curso-adicionar-icone">+</span>
            <span className="curso-adicionar-texto">Adicionar curso</span>
          </button>
        )}
      </div>

      {modalAberto && (
        <Modal onClose={() => setModalAberto(false)}>
          <h2 className="modal-titulo">
            {cursoEditandoId ? 'Editar curso' : 'Adicionar novo curso'}
          </h2>

          <form className="curso-form" onSubmit={handleSubmit}>
            <label>
              Título
              <input
                type="text"
                name="titulo"
                value={novoCurso.titulo}
                onChange={handleChange}
                placeholder="Ex: Valorant"
                required
              />
            </label>

            <label>
              Descrição
              <textarea
                name="descricao"
                value={novoCurso.descricao}
                onChange={handleChange}
                placeholder="Breve descrição do curso..."
                rows={3}
                required
              />
            </label>

            <div className="imagem-campo">
              <span className="imagem-campo-label">Imagem de capa</span>
              <div className="imagem-picker">
                {/* Imagens prontas da pasta public/img */}
                {IMAGENS_CURSO.map(arquivo => (
                  <button
                    type="button"
                    key={arquivo}
                    className={`imagem-opcao ${novoCurso.imagem === arquivo ? 'imagem-opcao--ativa' : ''}`}
                    onClick={() => selecionarImagem(arquivo)}
                    title={arquivo}
                  >
                    <img src={`/img/${arquivo}`} alt={arquivo} />
                  </button>
                ))}

                {/* Opção de importar uma imagem nova do computador. A própria
                    label funciona como botão e abre o seletor de arquivos.
                    Fica destacada quando a imagem escolhida é um upload (data URL). */}
                <label
                  className={`imagem-opcao imagem-opcao--upload ${novoCurso.imagem.startsWith('data:') ? 'imagem-opcao--ativa' : ''}`}
                  title="Importar nova imagem"
                >
                  {novoCurso.imagem.startsWith('data:') ? (
                    <img src={novoCurso.imagem} alt="nova imagem" />
                  ) : (
                    <span className="imagem-opcao-novo">+<br />Nova</span>
                  )}
                  <input type="file" accept="image/*" hidden onChange={handleImagemUpload} />
                </label>
              </div>
            </div>

            <div className="curso-form-row">
              <label className="toggle-label">
                Curso pago?
                <input
                  type="checkbox"
                  name="pago"
                  checked={novoCurso.pago}
                  onChange={handleChange}
                  className="toggle-checkbox"
                />
                <span className="toggle-switch"></span>
              </label>
            </div>

            {novoCurso.pago && (
              <label>
                Preço (R$)
                <input
                  type="number"
                  name="preco"
                  value={novoCurso.preco}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                />
              </label>
            )}

            <label>
              Horas totais
              <input
                type="number"
                name="horas"
                value={novoCurso.horas}
                onChange={handleChange}
                min="0"
                step="1"
              />
            </label>

            <label className="curso-comchat-check">
              <input
                type="checkbox"
                name="comChat"
                checked={novoCurso.comChat}
                onChange={handleChange}
              />
              Curso com chat?
            </label>

            <div className="ranking-methods-field">
              <span className="ranking-methods-label">Formas de Rankeamento</span>
              {(novoCurso.rankingMethods || []).map((rm, idx) => (
                <div key={idx} className="ranking-method-item">
                  <span className="ranking-method-nome">{rm.nome}</span>
                  <button
                    type="button"
                    className="ranking-method-remove"
                    onClick={() => removerRankingMethod(idx)}
                    title="Remover"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button type="button" className="ranking-method-add" onClick={adicionarRankingMethod}>
                + Adicionar
              </button>
            </div>

            <div className="curso-form-acoes">
              {cursoEditandoId && (
                <button
                  type="button"
                  className="btn-excluir"
                  onClick={handleExcluir}
                >
                  Excluir curso
                </button>
              )}

              <div className="curso-form-spacer" />

              <button
                type="button"
                className="btn-cancelar"
                onClick={() => setModalAberto(false)}
              >
                Cancelar
              </button>

              <button type="submit" className="btn-salvar">
                {cursoEditandoId ? 'Salvar alterações' : 'Salvar curso'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal pós-matrícula: pergunta se o usuário quer ir direto ao curso
          ou continuar navegando pela lista. */}
      {cursoMatriculadoId && (
        <Modal onClose={() => setCursoMatriculadoId(null)}>
          <h2 className="modal-titulo">Matrícula confirmada! 🎉</h2>
          <p style={{ marginBottom: '1.5rem' }}>
            Você se matriculou no curso. O que deseja fazer agora?
          </p>
          <div className="compt-modal-actions">
            <button
              className="btn-primary"
              onClick={() => {
                const id = cursoMatriculadoId
                setCursoMatriculadoId(null)
                navigate(`/cursos/${id}`)
              }}
            >
              Ir para o curso
            </button>
            <button
              className="btn-secondary"
              onClick={() => setCursoMatriculadoId(null)}
            >
              Continuar vendo os cursos
            </button>
          </div>
        </Modal>
      )}
    </Layout>
  )
}