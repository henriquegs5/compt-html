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

import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'

import { atualizarPerfilBackend, deletarPerfil, fetchPerfil } from '../store/perfilSlice'
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
  const statusPerfil = useSelector(s => s.perfil.status)

  // Ao montar a tela de perfil, se houver usuário mas os dados estiverem vazios (F5), baixa do backend
  useEffect(() => {
    if (usuario && (!dados || statusPerfil === 'idle')) {
      dispatch(fetchPerfil())
    }
  }, [usuario, dados, statusPerfil, dispatch])

  // ---------- estados do modal de edição ----------
  const [editando, setEditando] = useState(false)

  // Campos do formulário de edição
  const [bio,   setBio]   = useState('')
  // ranks: cópia local do array de ranks para edição no modal
  const [ranks, setRanks] = useState([])
  // avatar: imagem escolhida pelo usuário, guardada como data URL (base64).
  // Começa com o avatar atual e só muda se o usuário importar uma nova imagem.
  const [avatar, setAvatar] = useState('')

  // ---------- estado do modal de exclusão ----------
  const [confirmandoDelete, setConfirmandoDelete] = useState(false)

  // ---------- toast ----------
  const [toast, setToast] = useState(null)

  // Avatar exibido no card: imagem importada pelo usuário (avatarUrl) ou,
  // se ele ainda não escolheu nenhuma, um avatar gerado a partir do uid.
  const avatarAtual = dados?.avatarUrl || `https://i.pravatar.cc/80?u=${usuario?.uid}`

  // Abre o modal de edição com os dados atuais pré-preenchidos
  function abrirEdicao() {
    setBio(dados?.bio ?? '')
    // Copia o array de ranks para não mutar o estado Redux diretamente
    setRanks(dados?.ranks?.map(r => ({ ...r })) ?? [])
    setAvatar(dados?.avatarUrl ?? '')
    setEditando(true)
  }

  // Lê a imagem escolhida no input de arquivo e a converte para data URL
  // (texto base64), que é o formato que enviamos ao backend e guardamos no
  // banco. Validamos tipo (precisa ser imagem) e tamanho para não estourar
  // o limite do corpo da requisição nem o documento no MongoDB.
  function handleAvatarChange(e) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setToast('Selecione um arquivo de imagem.')
      return
    }
    // Limite de 2 MB — base64 cresce ~33%, então fica bem abaixo do limite
    // de 5 MB que configuramos no backend.
    if (file.size > 2 * 1024 * 1024) {
      setToast('Imagem muito grande. Escolha uma com até 2 MB.')
      return
    }

    const reader = new FileReader()
    reader.onload = () => setAvatar(reader.result) // reader.result = data URL
    reader.readAsDataURL(file)
  }

  // Atualiza o rank de um jogo específico enquanto o usuário digita
  // idx = índice no array, valor = texto digitado
  function handleRankChange(idx, valor) {
    setRanks(prev => prev.map((r, i) => i === idx ? { ...r, rank: valor } : r))
  }

  // Salva as alterações no Redux. Só mandamos avatarUrl se o usuário escolheu
  // uma imagem (avatar preenchido) — assim não sobrescrevemos com vazio.
  function salvar() {
    const payload = { bio, ranks }
    if (avatar) payload.avatarUrl = avatar
    dispatch(atualizarPerfilBackend(payload))
    setEditando(false)
    setToast('Perfil atualizado com sucesso!')
  }

  // Remove a foto de perfil do servidor. Mandamos avatarUrl vazio: o backend
  // grava '' no banco e, como esse valor é "falsy", o display volta a usar o
  // avatar gerado pelo uid. Só chama o backend se havia uma foto salva; caso
  // contrário apenas limpa a imagem recém-escolhida no preview.
  function removerAvatar() {
    setAvatar('')
    if (dados?.avatarUrl) {
      dispatch(atualizarPerfilBackend({ avatarUrl: '' }))
      setToast('Foto de perfil removida.')
    }
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
          {/* Avatar: imagem importada pelo usuário, ou gerada pelo uid se ele
              ainda não escolheu nenhuma */}
          <img
            src={avatarAtual}
            className="profile-avatar"
            alt="avatar"
          />

          <div className="profile-info">
            {/* Nome vem diretamente do usuário autenticado (não de um perfil mockado) */}
            <h2>{usuario?.name}</h2>

            {/* Bio vem do estado editável do Redux */}
            <p className="profile-bio">{dados.bio || 'Sem bio ainda.'}</p>

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

          {/* Campo: foto de perfil — preview da imagem + botão de importar */}
          <div className="compt-modal-field">
            <label>Foto de perfil</label>
            <div className="avatar-upload">
              <img
                src={avatar || avatarAtual}
                className="avatar-preview"
                alt="prévia do avatar"
              />
              <div className="avatar-upload-actions">
                {/* O input de arquivo nativo é feio; escondemos ele e usamos a
                    própria <label> como botão estilizado para abrir o seletor */}
                <label className="btn-secondary avatar-upload-btn">
                  Importar imagem
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    hidden
                  />
                </label>
                {/* Remove a foto (do servidor, se já estiver salva) e volta ao
                    avatar gerado automaticamente */}
                {(avatar || dados?.avatarUrl) && (
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
