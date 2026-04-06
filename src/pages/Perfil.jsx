import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'

// Importamos as actions do perfilSlice: buscar, editar e deletar
import { fetchPerfil, updatePerfil, deletarPerfil } from '../store/perfilSlice'

// Importamos o logout do authSlice para deslogar após excluir a conta
import { fazerLogout } from '../store/authSlice'

import Layout from '../components/Layout'
import Modal from '../components/Modal'
import Toast from '../components/Toast'
import './Perfil.css'

export default function Perfil() {
  // dispatch: função para enviar ações ao Redux
  const dispatch  = useDispatch()

  // navigate: função para navegar entre telas
  const navigate  = useNavigate()

  // Lê os dados do perfil e o status de carregamento do Redux (variável local global)
  const { dados, status } = useSelector(s => s.perfil)

  // Lê o usuário logado do Redux (para montar o avatar, se necessário)
  const usuario = useSelector(s => s.auth.usuario)

  // Estado local: controla se o modal de edição está aberto
  const [editando, setEditando] = useState(false)

  // Estados locais: guardam os valores digitados no formulário de edição
  const [nome, setNome] = useState('')
  const [bio,  setBio]  = useState('')

  // Estado local: controla se o modal de confirmação de exclusão está aberto
  const [confirmandoDelete, setConfirmandoDelete] = useState(false)

  // Estado local: guarda a mensagem do toast (aviso flutuante na tela)
  const [toast, setToast] = useState(null)

  // useEffect: roda automaticamente quando o componente é exibido na tela
  // Se o perfil ainda não foi carregado (status 'idle'), faz o fetch no json-server
  useEffect(() => {
    if (status === 'idle') dispatch(fetchPerfil())
  }, [dispatch, status])

  // Função: abre o modal de edição e preenche os campos com os dados atuais
  function abrirEdicao() {
    setNome(dados?.nome ?? '')  // ?? significa "se for nulo, usa string vazia"
    setBio(dados?.bio  ?? '')
    setEditando(true)
  }

  // Função: salva as alterações do perfil localmente no Redux (updatePerfil)
  function salvar() {
    // Envia a action updatePerfil com os novos dados — atualiza a variável local no Redux
    dispatch(updatePerfil({ nome: nome || 'Jogador', bio }))
    setEditando(false)
    setToast('Perfil atualizado com sucesso!')
  }

  // Função: deleta o perfil e a conta do usuário
  function confirmarDelete() {
    // 1. Apaga os dados do perfil da variável local do Redux
    dispatch(deletarPerfil())

    // 2. Faz logout: remove a sessão do localStorage e limpa o estado de autenticação
    dispatch(fazerLogout())

    // 3. Redireciona o usuário para a tela de login
    navigate('/login')
  }

  return (
    <Layout>
      <h1 className="title">Perfil</h1>

      {/* Mostra mensagem de carregamento enquanto busca os dados no json-server */}
      {status === 'loading' && <p className="loading-msg">Carregando perfil...</p>}

      {/* Mostra o card de perfil quando os dados já estão carregados */}
      {dados && (
        <div className="profile-card">
          <div className="profile-banner" />
          <div className="profile-header">
            {/* Avatar do usuário — usa a URL salva no perfil ou gera um avatar pelo uid */}
            <img
              src={dados.avatarUrl ?? `https://i.pravatar.cc/80?u=${usuario?.uid}`}
              className="profile-avatar"
              alt="avatar"
            />
            <div className="profile-info">
              {/* LISTAGEM (Read): exibe os dados do perfil que estão na variável local do Redux */}
              <h2>{dados.nome}</h2>
              <p className="profile-bio">{dados.bio}</p>

              {/* Botão para abrir o modal de edição */}
              <button className="edit-btn" onClick={abrirEdicao}>Editar perfil</button>

              {/* Botão para abrir a confirmação de exclusão da conta */}
              <button
                className="edit-btn"
                onClick={() => setConfirmandoDelete(true)}
                style={{ marginTop: '0.5rem', background: '#c0392b', borderColor: '#c0392b' }}
              >
                Excluir Conta
              </button>
            </div>
          </div>

          {/* Stats estáticos do perfil (rankings nos jogos) */}
          <div className="profile-stats">
            <div className="profile-stat"><p>Fortnite</p><strong>Surreal</strong></div>
            <div className="profile-stat"><p>Rainbow Six</p><strong>Diamante</strong></div>
            <div className="profile-stat"><p>Clash Royale</p><strong>12.700 🏆</strong></div>
          </div>
        </div>
      )}

      {/* Modal de EDIÇÃO (Update): aparece quando o usuário clica em "Editar perfil" */}
      {editando && (
        <Modal onClose={() => setEditando(false)}>
          <h3 style={{ marginBottom: '1.2rem' }}>Editar Perfil</h3>

          {/* Campo para editar o nome */}
          <div className="compt-modal-field">
            <label>Nome</label>
            <input type="text" value={nome} onChange={e => setNome(e.target.value)} maxLength={30} />
          </div>

          {/* Campo para editar a bio */}
          <div className="compt-modal-field">
            <label>Bio</label>
            <textarea rows={3} value={bio} onChange={e => setBio(e.target.value)} />
          </div>

          <div className="compt-modal-actions" style={{ marginTop: '1.4rem' }}>
            {/* Botão salvar: chama a função que envia os dados ao Redux */}
            <button className="btn-primary"   onClick={salvar}>Salvar</button>
            <button className="btn-secondary" onClick={() => setEditando(false)}>Cancelar</button>
          </div>
        </Modal>
      )}

      {/* Modal de CONFIRMAÇÃO DE EXCLUSÃO (Delete): pergunta se o usuário tem certeza */}
      {confirmandoDelete && (
        <Modal onClose={() => setConfirmandoDelete(false)}>
          <h3 style={{ marginBottom: '1rem', color: '#c0392b' }}>Excluir Conta</h3>
          <p style={{ marginBottom: '1.5rem' }}>
            Tem certeza que deseja excluir sua conta? Esta ação não pode ser desfeita.
          </p>
          <div className="compt-modal-actions">
            {/* Botão confirmar: chama a função que apaga o perfil e desloga */}
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

      {/* Toast: mensagem flutuante de sucesso após editar o perfil */}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </Layout>
  )
}
