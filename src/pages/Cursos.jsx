import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import {
  fetchCursos,
  adicionarCurso,
  editarCurso,
  excluirCurso,
  selectAllCursos,
} from '../store/cursosSlice'
import Layout from '../components/Layout'
import Modal from '../components/Modal'
import './Cursos.css'

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
  const usuario = useSelector(s => s.auth.usuario)

  const podeAdicionar = usuario?.role === 'admin' || usuario?.role === 'moderador'

  const [modalAberto, setModalAberto] = useState(false)
  const [cursoEditandoId, setCursoEditandoId] = useState(null)
  const [termoPesquisa, setTermoPesquisa] = useState('')
  const [novoCurso, setNovoCurso] = useState({
    titulo: '',
    descricao: '',
    imagem: '',
  })

  useEffect(() => {
    if (status === 'idle') dispatch(fetchCursos())
  }, [dispatch, status])

  const cursosFiltrados = items.filter(curso =>
    curso.titulo.toLowerCase().includes(termoPesquisa.toLowerCase()) ||
    curso.descricao.toLowerCase().includes(termoPesquisa.toLowerCase())
  )

  /**
   * Abre o modal limpo para a criação de um novo curso.
   * @function abrirModal
   */
  function abrirModal() {
    setNovoCurso({ titulo: '', descricao: '', imagem: '' })
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
    const { name, value } = e.target
    setNovoCurso(prev => ({ ...prev, [name]: value }))
  }

  /**
   * Envia o formulário para criar ou editar o curso.
   * @function handleSubmit
   * @param {React.FormEvent} e - O evento de submissão do formulário
   */
  function handleSubmit(e) {
    e.preventDefault()

    if (!novoCurso.titulo.trim() || !novoCurso.descricao.trim()) {
      alert('Preencha o título e a descrição do curso.')
      return
    }

    if (cursoEditandoId) {
      dispatch(editarCurso({ id: cursoEditandoId, ...novoCurso }))
    } else {
      dispatch(adicionarCurso(novoCurso))
    }

    setModalAberto(false)
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
        {cursosFiltrados.map(curso => (
          <div className="curso-card" key={curso.id}>
            <div className="curso-image">
              <img
                src={`/img/${curso.imagem}`}
                alt={curso.titulo}
                onError={e => e.target.style.display = 'none'}
              />
              <div className="curso-overlay" />
            </div>

            {podeAdicionar && (
              <button
                className="btn-editar-curso"
                onClick={() => abrirModalEdicao(curso)}
                title="Editar curso"
              >
                ✏️
              </button>
            )}

            <div className="curso-body">
              <h2 className="curso-titulo">{curso.titulo}</h2>
              <p className="curso-descricao">{curso.descricao}</p>

              <div className="curso-footer">
                <span className="curso-modulos-count">
                  {curso.totalModulos} módulos
                </span>

                <button
                  className="btn-abrir-curso"
                  onClick={() => {
                    if (!usuario) {
                      alert('Você precisa fazer login para acessar este curso.')
                      navigate('/login')
                    } else {
                      navigate(`/cursos/${curso.id}`)
                    }
                  }}
                >
                  Abrir curso
                </button>
              </div>
            </div>
          </div>
        ))}

        {podeAdicionar && (
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

            <label>
              Imagem (arquivo em /public/img)
              <input
                type="text"
                name="imagem"
                value={novoCurso.imagem}
                onChange={handleChange}
                placeholder="Ex: valorant.jpg"
              />
            </label>

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
    </Layout>
  )
}