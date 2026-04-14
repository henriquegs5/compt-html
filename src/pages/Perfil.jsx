// ============================================================
// pages/Perfil.jsx
// Página de perfil do usuário logado.
//
// Dados exibidos:
//   - Nome e avatar: sempre do usuário autenticado (auth.usuario)
//   - Bio: estado local do Redux (perfilSlice)
//   - Ranks: estado local do Redux, editável pelo usuário
//
// Por que não usar o json-server para o perfil?
//   O json-server guarda um único objeto /perfil fixo (mock).
//   Para exibir o perfil correto de cada usuário logado, usamos
//   o estado Redux inicializado no momento do login.
// ============================================================

import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'

import { updatePerfil, deletarPerfil } from '../store/perfilSlice'
import { fazerLogout } from '../store/authSlice'

import Layout from '../components/Layout'
import Modal  from '../components/Modal'
import Toast  from '../components/Toast'
import './Perfil.css'

export default function Perfil() {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  // Usuário logado — fonte principal para nome e avatar
  const usuario = useSelector(s => s.auth.usuario)

  // Dados editáveis do perfil (bio e ranks) — estado local do Redux
  const dados = useSelector(s => s.perfil.dados)

  // ---------- estados do modal de edição ----------
  const [editando, setEditando] = useState(false)

  // Campos do formulário de edição
  const [nome,  setNome]  = useState('')
  const [bio,   setBio]   = useState('')
  // ranks: cópia local do array de ranks para edição no modal
  const [ranks, setRanks] = useState([])

  // ---------- estado do modal de exclusão ----------
  const [confirmandoDelete, setConfirmandoDelete] = useState(false)

  // ---------- toast ----------
  const [toast, setToast] = useState(null)

  // Abre o modal de edição com os dados atuais pré-preenchidos
  function abrirEdicao() {
    setNome(usuario?.name ?? '')
    setBio(dados?.bio ?? '')
    // Copia o array de ranks para não mutar o estado Redux diretamente
    setRanks(dados?.ranks?.map(r => ({ ...r })) ?? [])
    setEditando(true)
  }

  // Atualiza o rank de um jogo específico enquanto o usuário digita
  // idx = índice no array, valor = texto digitado
  function handleRankChange(idx, valor) {
    setRanks(prev => prev.map((r, i) => i === idx ? { ...r, rank: valor } : r))
  }

  // Salva as alterações no Redux
  function salvar() {
    dispatch(updatePerfil({ bio, ranks }))
    setEditando(false)
    setToast('Perfil atualizado com sucesso!')
  }

  // Exclui a conta: limpa o perfil, faz logout e redireciona
  function confirmarDelete() {
    dispatch(deletarPerfil())
    dispatch(fazerLogout())
    navigate('/login')
  }

  // Enquanto o perfil ainda não foi inicializado (ex: usuário acabou de logar)
  if (!dados) return <Layout><p className="loading-msg">Carregando perfil...</p></Layout>

  return (
    <Layout>
      <h1 className="title">Perfil</h1>

      <div className="profile-card">
        <div className="profile-banner" />

        <div className="profile-header">
          {/* Avatar: gerado pelo uid do usuário logado — único por conta */}
          <img
            src={`https://i.pravatar.cc/80?u=${usuario?.uid}`}
            className="profile-avatar"
            alt="avatar"
          />

          <div className="profile-info">
            {/* Nome vem diretamente do usuário autenticado (não de um perfil mockado) */}
            <h2>{usuario?.name}</h2>

            {/* Bio vem do estado editável do Redux */}
            <p className="profile-bio">{dados.bio || 'Sem bio ainda.'}</p>

            <button className="edit-btn" onClick={abrirEdicao}>Editar perfil</button>

            <button
              className="edit-btn"
              onClick={() => setConfirmandoDelete(true)}
              style={{ marginTop: '0.5rem', background: '#c0392b', borderColor: '#c0392b' }}
            >
              Excluir Conta
            </button>
          </div>
        </div>

        {/* Seção de ranks — um bloco por jogo, editável pelo modal de edição */}
        <div className="profile-stats">
          {dados.ranks?.map(r => (
            <div className="profile-stat" key={r.jogo}>
              <p>{r.jogo}</p>
              {/* Mostra o rank preenchido ou "—" se ainda não foi informado */}
              <strong>{r.rank || '—'}</strong>
            </div>
          ))}
        </div>
      </div>

      {/* ---- Modal de edição de perfil ---- */}
      {editando && (
        <Modal onClose={() => setEditando(false)}>
          <h3 style={{ marginBottom: '1.2rem' }}>Editar Perfil</h3>

          {/* Campo: bio */}
          <div className="compt-modal-field">
            <label>Bio</label>
            <textarea rows={3} value={bio} onChange={e => setBio(e.target.value)} />
          </div>

          {/* Campos de rank — um input por jogo */}
          <div style={{ marginTop: '1rem' }}>
            <p style={{ fontSize: '.82rem', color: 'var(--text-muted)', marginBottom: '.7rem', fontWeight: 600 }}>
              Seus ranks
            </p>
            {ranks.map((r, idx) => (
              <div className="compt-modal-field" key={r.jogo}>
                <label>{r.jogo}</label>
                <input
                  type="text"
                  value={r.rank}
                  onChange={e => handleRankChange(idx, e.target.value)}
                  placeholder="Ex: Diamante, Surreal, 12.000 🏆..."
                  maxLength={30}
                />
              </div>
            ))}
          </div>

          <div className="compt-modal-actions" style={{ marginTop: '1.4rem' }}>
            <button className="btn-primary"   onClick={salvar}>Salvar</button>
            <button className="btn-secondary" onClick={() => setEditando(false)}>Cancelar</button>
          </div>
        </Modal>
      )}

      {/* ---- Modal de confirmação de exclusão de conta ---- */}
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
