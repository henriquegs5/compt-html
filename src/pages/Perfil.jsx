import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useParams } from 'react-router-dom'

import {
  atualizarPerfilBackend, deletarPerfil, fetchPerfil,
  fetchUserById, fetchEstatisticasPublicas
} from '../store/perfilSlice'
import { fazerLogout } from '../store/authSlice'
import { fetchEstatisticas, salvarEstatisticas } from '../store/estatisticasSlice'

import { avatarUrl } from '../utils/avatar'
import Layout from '../components/Layout'
import Modal  from '../components/Modal'
import Toast  from '../components/Toast'
import './Perfil.css'

export default function Perfil() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { userId } = useParams()

  const usuario = useSelector(s => s.auth.usuario)
  const dados = useSelector(s => s.perfil.dados)
  const statusPerfil = useSelector(s => s.perfil.status)
  const cursosStats = useSelector(s => s.estatisticas.items)
  const estatStatus = useSelector(s => s.estatisticas.status)
  const perfilVisitado = useSelector(s => s.perfil.perfilVisitado)
  const perfilVisitadoStatus = useSelector(s => s.perfil.perfilVisitadoStatus)
  const perfilVisitadoStats = useSelector(s => s.perfil.perfilVisitadoStats)

  const isVisitando = !!userId

  useEffect(() => {
    if (isVisitando) {
      dispatch(fetchUserById(userId))
      dispatch(fetchEstatisticasPublicas(userId))
    } else {
      if (usuario && (!dados || statusPerfil === 'idle')) {
        dispatch(fetchPerfil())
      }
      if (estatStatus === 'idle') {
        dispatch(fetchEstatisticas())
      }
    }
  }, [isVisitando, userId, dispatch])

  const [editando, setEditando] = useState(false)
  const [bio, setBio] = useState('')
  const [avatar, setAvatar] = useState('')
  const [cursoStatsEdit, setCursoStatsEdit] = useState([])

  const [confirmandoDelete, setConfirmandoDelete] = useState(false)
  const [toast, setToast] = useState(null)

  const avatarExiste = !!avatarUrl(isVisitando ? perfilVisitado : dados)

  function abrirEdicao() {
    setBio(dados?.bio ?? '')
    setAvatar(avatarUrl(dados))
    setEditando(true)

    function extrairStats(data) {
      if (!Array.isArray(data)) return []
      return data.map(c => ({
        cursoId: c.cursoId,
        titulo: c.titulo,
        rankingMethods: c.rankingMethods || [],
        stats: c.stats ? c.stats.map(s => ({ ...s })) : []
      }))
    }

    if (estatStatus === 'idle' || estatStatus === 'failed') {
      dispatch(fetchEstatisticas()).then((res) => {
        if (res.meta.requestStatus === 'fulfilled') {
          setCursoStatsEdit(extrairStats(res.payload))
        }
      })
    } else {
      setCursoStatsEdit(extrairStats(cursosStats))
    }
  }

  function handleAvatarChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setToast('Selecione um arquivo de imagem.')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setToast('Imagem muito grande. Escolha uma com até 2 MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => setAvatar(reader.result)
    reader.readAsDataURL(file)
  }

  function handleCursoStatChange(cursoIdx, statNome, valor) {
    setCursoStatsEdit(prev => prev.map((c, ci) => {
      if (ci !== cursoIdx) return c
      const existente = c.stats.find(s => s.nome === statNome)
      const novaStats = existente
        ? c.stats.map(s => s.nome === statNome ? { ...s, valor } : s)
        : [...c.stats, { nome: statNome, valor, publico: false }]
      return { ...c, stats: novaStats }
    }))
  }

  function handleStatVisibilityToggle(cursoIdx, statNome) {
    setCursoStatsEdit(prev => prev.map((c, ci) => {
      if (ci !== cursoIdx) return c
      const existente = c.stats.find(s => s.nome === statNome)
      const novaStats = existente
        ? c.stats.map(s => s.nome === statNome ? { ...s, publico: !s.publico } : s)
        : [...c.stats, { nome: statNome, valor: '', publico: true }]
      return { ...c, stats: novaStats }
    }))
  }

  function salvar() {
    const payload = { bio }
    if (avatar) payload.avatarUrl = avatar
    dispatch(atualizarPerfilBackend(payload))
    setEditando(false)
    setToast('Perfil atualizado com sucesso!')

    cursoStatsEdit.forEach(c => {
      if (c.stats.length > 0) {
        dispatch(salvarEstatisticas({ cursoId: c.cursoId, stats: c.stats }))
      }
    })
  }

  function removerAvatar() {
    setAvatar('')
    if (dados?.avatarUrl) {
      dispatch(atualizarPerfilBackend({ avatarUrl: '' }))
      setToast('Foto de perfil removida.')
    }
  }

  function confirmarDelete() {
    dispatch(deletarPerfil())
    dispatch(fazerLogout())
    navigate('/login')
  }

  const perfilAtual = isVisitando ? perfilVisitado : dados

  if (!perfilAtual) {
    return <Layout><p className="loading-msg">Carregando perfil...</p></Layout>
  }

  return (
    <Layout>
      <h1 className="title">Perfil</h1>

      {isVisitando && (
        <button className="btn-voltar" onClick={() => navigate(-1)} style={{ marginBottom: '1rem' }}>
          ← Voltar
        </button>
      )}

      <div className="profile-card">
        <div className="profile-banner" />

        <div className="profile-header">
          {avatarExiste ? (
            <img src={perfilAtual.avatarUrl} className="profile-avatar" alt="avatar" />
          ) : (
            <div className="profile-avatar avatar--placeholder-lg">👤</div>
          )}

          <div className="profile-info">
            <h2>{perfilAtual.name}</h2>
            <p className="profile-bio">{perfilAtual.bio || 'Sem bio ainda.'}</p>

            {!isVisitando && (
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button className="edit-btn" onClick={abrirEdicao}>Editar perfil</button>
                <button
                  className="edit-btn"
                  onClick={() => setConfirmandoDelete(true)}
                  style={{ background: '#c0392b', borderColor: '#c0392b' }}
                >
                  Excluir Conta
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {isVisitando ? (
        <div className="profile-stats-caixas">
          {perfilVisitadoStats.map(curso => {
            const statsComValor = Array.isArray(curso.stats) ? curso.stats.filter(s => s.valor?.trim()) : []
            if (statsComValor.length === 0) return null
            return (
              <div className="stat-caixa" key={curso.cursoId}>
                <h4 className="stat-caixa-titulo">{curso.titulo}</h4>
                {statsComValor.map(s => (
                  <div className="stat-caixa-item" key={s.nome}>
                    <span className="stat-caixa-label">{s.nome}</span>
                    <span className="stat-caixa-valor">{s.valor}</span>
                  </div>
                ))}
              </div>
            )
          })}
          {perfilVisitadoStats.length === 0 && perfilVisitado && (
            <p style={{ color: 'var(--text-muted)', fontSize: '.85rem' }}>
              Este usuário não possui estatísticas públicas.
            </p>
          )}
        </div>
      ) : (
        <div className="profile-stats-caixas">
          {cursosStats.map(curso => {
            const statsComValor = Array.isArray(curso.stats) ? curso.stats.filter(s => s.valor?.trim() && s.publico) : []
            if (statsComValor.length === 0) return null
            return (
              <div className="stat-caixa" key={curso.cursoId}>
                <h4 className="stat-caixa-titulo">{curso.titulo}</h4>
                {statsComValor.map(s => (
                  <div className="stat-caixa-item" key={s.nome}>
                    <span className="stat-caixa-label">{s.nome}</span>
                    <span className="stat-caixa-valor">{s.valor}</span>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      )}

      {editando && (
        <Modal onClose={() => setEditando(false)}>
          <h3 style={{ marginBottom: '1.2rem' }}>Editar Perfil</h3>

          <div className="compt-modal-field">
            <label>Foto de perfil</label>
            <div className="avatar-upload">
              {avatar || avatarUrl(dados) ? (
                <img src={avatar || avatarUrl(dados)} className="avatar-preview" alt="prévia do avatar" />
              ) : (
                <div className="avatar-preview avatar--placeholder-lg">👤</div>
              )}
              <div className="avatar-upload-actions">
                <label className="btn-secondary avatar-upload-btn">
                  Importar imagem
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    hidden
                  />
                </label>
                {(avatar || avatarUrl(dados)) && (
                  <button
                    type="button"
                    className="avatar-remove-btn"
                    onClick={removerAvatar}
                  >
                    Remover
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="compt-modal-field">
            <label>Bio</label>
            <textarea rows={3} value={bio} onChange={e => setBio(e.target.value)} />
          </div>

          {cursoStatsEdit.length > 0 && (
            <div style={{ marginTop: '1.2rem' }}>
              <p style={{ fontSize: '.82rem', color: 'var(--text-muted)', marginBottom: '.7rem', fontWeight: 600 }}>
                Estatísticas dos cursos
              </p>
              {cursoStatsEdit.map((curso, ci) => (
                curso.rankingMethods.length > 0 && (
                  <div key={curso.cursoId} style={{ marginBottom: '1rem' }}>
                    <p style={{ fontSize: '.85rem', fontWeight: 600, color: 'var(--text)', marginBottom: '.4rem' }}>
                      {curso.titulo}
                    </p>
                    {curso.rankingMethods.map(rm => {
                      const stat = curso.stats.find(s => s.nome === rm.nome)
                      return (
                        <div className="compt-modal-field" key={rm.nome}>
                          <label>{rm.nome}</label>
                          <div className="stat-edit-row">
                            <input
                              type="text"
                              value={stat?.valor || ''}
                              onChange={e => handleCursoStatChange(ci, rm.nome, e.target.value)}
                              placeholder={`Informe seu ${rm.nome.toLowerCase()}...`}
                              maxLength={30}
                            />
                            <label className="stat-visibilidade-toggle">
                              <input
                                type="checkbox"
                                checked={stat?.publico ?? false}
                                onChange={() => handleStatVisibilityToggle(ci, rm.nome)}
                              />
                              <span>{stat?.publico ? 'Público' : 'Privado'}</span>
                            </label>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              ))}
            </div>
          )}

          <div className="compt-modal-actions" style={{ marginTop: '1.4rem' }}>
            <button className="btn-primary"   onClick={salvar}>Salvar</button>
            <button className="btn-secondary" onClick={() => setEditando(false)}>Cancelar</button>
          </div>
        </Modal>
      )}

      {confirmandoDelete && (
        <Modal onClose={() => setConfirmandoDelete(false)}>
          <h3 style={{ marginBottom: '1rem', color: '#c0392b' }}>Excluir Conta</h3>
          <p style={{ marginBottom: '1.5rem' }}>
            Tem certeza que deseja excluir sua conta? Esta ação não pode ser desfeita.
          </p>
          <div className="compt-modal-actions">
            <button
              className="btn-primary"
              onClick={confirmarDelete}
              style={{ background: '#c0392b', borderColor: '#c0392b' }}
            >
              Sim, excluir
            </button>
            <button className="btn-secondary" onClick={() => setConfirmandoDelete(false)}>
              Cancelar
            </button>
          </div>
        </Modal>
      )}

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </Layout>
  )
}
