import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { fetchCursos, adicionarCurso, editarCurso, excluirCurso } from '../store/cursosSlice'
import Layout from '../components/Layout'
import Modal from '../components/Modal'
import './Cursos.css'

export default function Cursos() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { items, status } = useSelector(s => s.cursos)
  const usuario = useSelector(s => s.auth.usuario)

  const podeAdicionar = usuario?.role === 'admin' || usuario?.role === 'moderador'

  const [modalAberto, setModalAberto] = useState(false)
  const [cursoEditandoId, setCursoEditandoId] = useState(null)
  const [novoCurso, setNovoCurso] = useState({
    titulo: '',
    descricao: '',
    imagem: '',
    totalModulos: 0,
  })

  useEffect(() => {
    if (status === 'idle') dispatch(fetchCursos())
  }, [dispatch, status])

  function abrirModal() {
    setNovoCurso({ titulo: '', descricao: '', imagem: '', totalModulos: 0 })
    setCursoEditandoId(null)
    setModalAberto(true)
  }

  function abrirModalEdicao(curso) {
    setNovoCurso({
      titulo: curso.titulo,
      descricao: curso.descricao,
      imagem: curso.imagem,
      totalModulos: curso.totalModulos,
    })
    setCursoEditandoId(curso.id)
    setModalAberto(true)
  }

  function handleChange(e) {
    const { name, value } = e.target
    setNovoCurso(prev => ({ ...prev, [name]: value }))
  }

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
      <input type="text" className="page-search" placeholder="Pesquisar curso..." />

      {status === 'loading' && <p className="loading-msg">Carregando cursos...</p>}

      <div className="cursos-grid">
        {items.map(curso => (
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
                  onClick={() => navigate(`/cursos/${curso.id}`)}
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

            <label>
              Total de módulos
              <input
                type="number"
                name="totalModulos"
                value={novoCurso.totalModulos}
                onChange={handleChange}
                min="0"
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