import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchPerfil, updatePerfil } from '../store/perfilSlice'
import Layout from '../components/Layout'
import Modal from '../components/Modal'
import Toast from '../components/Toast'
import './Perfil.css'

export default function Perfil() {
  const dispatch = useDispatch()
  const { dados, status } = useSelector(s => s.perfil)
  const usuario           = useSelector(s => s.auth.usuario)

  const [editando, setEditando] = useState(false)
  const [nome, setNome]         = useState('')
  const [bio, setBio]           = useState('')
  const [toast, setToast]       = useState(null)

  useEffect(() => {
    if (status === 'idle') dispatch(fetchPerfil())
  }, [dispatch, status])

  function abrirEdicao() {
    setNome(dados?.nome ?? '')
    setBio(dados?.bio  ?? '')
    setEditando(true)
  }

  function salvar() {
    dispatch(updatePerfil({ nome: nome || 'Jogador', bio }))
    setEditando(false)
    setToast('Perfil atualizado com sucesso!')
  }

  return (
    <Layout>
      <h1 className="title">Perfil</h1>

      {status === 'loading' && <p className="loading-msg">Carregando perfil...</p>}

      {dados && (
        <div className="profile-card">
          <div className="profile-banner" />
          <div className="profile-header">
            <img
              src={dados.avatarUrl ?? `https://i.pravatar.cc/80?u=${usuario?.uid}`}
              className="profile-avatar"
              alt="avatar"
            />
            <div className="profile-info">
              <h2>{dados.nome}</h2>
              <p className="profile-bio">{dados.bio}</p>
              <button className="edit-btn" onClick={abrirEdicao}>Editar perfil</button>
            </div>
          </div>

          <div className="profile-stats">
            <div className="profile-stat"><p>Fortnite</p><strong>Surreal</strong></div>
            <div className="profile-stat"><p>Rainbow Six</p><strong>Diamante</strong></div>
            <div className="profile-stat"><p>Clash Royale</p><strong>12.700 🏆</strong></div>
          </div>
        </div>
      )}

      {editando && (
        <Modal onClose={() => setEditando(false)}>
          <h3 style={{ marginBottom: '1.2rem' }}>Editar Perfil</h3>
          <div className="compt-modal-field">
            <label>Nome</label>
            <input type="text" value={nome} onChange={e => setNome(e.target.value)} maxLength={30} />
          </div>
          <div className="compt-modal-field">
            <label>Bio</label>
            <textarea rows={3} value={bio} onChange={e => setBio(e.target.value)} />
          </div>
          <div className="compt-modal-actions" style={{ marginTop: '1.4rem' }}>
            <button className="btn-primary"   onClick={salvar}>Salvar</button>
            <button className="btn-secondary" onClick={() => setEditando(false)}>Cancelar</button>
          </div>
        </Modal>
      )}

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </Layout>
  )
}
