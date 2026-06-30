// ============================================================
// pages/PainelAdmin.jsx
// Painel de administração — acessível por admin e moderador.
//
// Funcionalidades:
//   - Lista todos os usuários cadastrados (nome, email, cargo, data)
//   - Barra de pesquisa para filtrar usuários por nome ou email
//   - Admin pode promover cliente → moderador ou despromover moderador → cliente
//   - Moderador vê a lista mas NÃO pode alterar cargos
//   - Admin e moderador podem remover usuários (exceto admins)
// ============================================================

import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { carregarTodosUsuarios, alterarCargo, removerUsuario } from '../store/usersSlice'
import { atualizarRole } from '../store/authSlice'
import { avatarUrl } from '../utils/avatar'
import Layout from '../components/Layout'
import './PainelAdmin.css'

// Lê o uid de um usuário do banco (o toJSON do modelo transforma _id → uid)
function getUid(user) {
  return user.uid || user._id?.toString()
}

export default function PainelAdmin() {
  const dispatch = useDispatch()
  
  // Usuário logado — usado para verificar permissões
  const usuarioLogado = useSelector(state => state.auth.usuario)
  // Lista de todos os usuários e status da requisição
  const usuarios = useSelector(state => state.users.lista)
  const status   = useSelector(state => state.users.status)
  const erro     = useSelector(state => state.users.erro)

  // Estado local para o filtro de pesquisa
  const [busca, setBusca] = useState('')

  // Carrega a lista de usuários do banco ao montar o componente
  useEffect(() => {
    dispatch(carregarTodosUsuarios())
  }, [dispatch])

  // Verifica se o usuário logado é admin (só admin altera cargos)
  const isAdmin = usuarioLogado?.role === 'admin'

  // Filtra usuários pela busca (nome ou email)
  const usuariosFiltrados = usuarios.filter(u =>
    u.name.toLowerCase().includes(busca.toLowerCase()) ||
    u.email.toLowerCase().includes(busca.toLowerCase())
  )

  // Alterna o cargo do usuário entre "cliente" e "moderador"
  // Somente admin pode executar esta ação
  async function handleAlterarCargo(uid, cargoAtual) {
    const novoRole = cargoAtual === 'cliente' ? 'moderador' : 'cliente'
    const resultado = await dispatch(alterarCargo({ uid, novoRole }))
    // Se o admin estiver alterando seu próprio cargo, atualiza a sessão local
    if (alterarCargo.fulfilled.match(resultado) && uid === getUid(usuarioLogado)) {
      dispatch(atualizarRole(novoRole))
    }
  }

  // Remove um usuário do sistema
  // Regra: não é possível remover um admin
  async function handleRemover(uid) {
    if (window.confirm('Tem certeza que deseja remover este usuário?')) {
      dispatch(removerUsuario(uid))
    }
  }

  // Retorna o texto do botão de cargo com base no cargo atual
  function textoBotaoCargo(role) {
    if (role === 'cliente') return 'Promover'
    if (role === 'moderador') return 'Despromover'
    return '' // admin não tem botão
  }

  return (
    <Layout>
      <h1 className="admin-titulo">Painel de Administração</h1>
      <p className="admin-subtitulo">
        {/* Mostra mensagem diferente para admin e moderador */}
        {isAdmin
          ? 'Gerencie os usuários e seus cargos na plataforma.'
          : 'Visualize os usuários cadastrados na plataforma.'}
      </p>

      {/* Feedback de carregamento e erros */}
      {status === 'loading' && <p className="admin-vazio">Carregando usuários…</p>}
      {erro && <p className="admin-vazio" style={{ color: 'var(--color-danger, #e74c3c)' }}>Erro: {erro}</p>}

      {/* Barra de pesquisa para filtrar usuários */}
      <input
        className="page-search"
        type="text"
        placeholder="Buscar por nome ou e-mail…"
        value={busca}
        onChange={e => setBusca(e.target.value)}
      />

      {/* Tabela de usuários */}
      <div className="admin-tabela-wrapper">
        <table className="admin-tabela">
          <thead>
            <tr>
              <th>Usuário</th>
              <th>E-mail</th>
              <th>Cargo</th>
              <th>Cadastro</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {usuariosFiltrados.map(user => {
              // uid pode vir como 'uid' (toJSON do modelo) ou '_id' dependendo da rota
              const uid = getUid(user)
              return (
              <tr key={uid}>
                {/* Coluna: avatar + nome */}
                <td>
                  <div className="admin-user-cell">
                    {(() => {
                      const url = avatarUrl(user)
                      return url ? (
                        <img className="admin-avatar" src={url} alt={user.name} />
                      ) : (
                        <div className="admin-avatar admin-avatar--placeholder">👤</div>
                      )
                    })()}
                    <span>{user.name}</span>
                  </div>
                </td>

                {/* Coluna: email */}
                <td>{user.email}</td>

                {/* Coluna: badge com o cargo do usuário */}
                <td>
                  <span className={`admin-badge admin-badge--${user.role}`}>
                    {user.role}
                  </span>
                </td>

                {/* Coluna: data de cadastro formatada */}
                <td>
                  {user.criadoEm
                    ? new Date(user.criadoEm).toLocaleDateString('pt-BR')
                    : '—'}
                </td>

                {/* Coluna: botões de ação */}
                <td>
                  <div className="admin-acoes">
                    {/* Botão de alterar cargo — só aparece para admin e não em admins */}
                    {isAdmin && user.role !== 'admin' && (
                      <button
                        className={`admin-btn ${user.role === 'cliente' ? 'admin-btn--promover' : 'admin-btn--despromover'}`}
                        onClick={() => handleAlterarCargo(uid, user.role)}
                      >
                        {textoBotaoCargo(user.role)}
                      </button>
                    )}

                    {/* Botão de remover — admin e moderador podem, mas nunca em admins */}
                    {user.role !== 'admin' && uid !== getUid(usuarioLogado) && (
                      <button
                        className="admin-btn admin-btn--remover"
                        onClick={() => handleRemover(uid)}
                      >
                        Remover
                      </button>
                    )}
                  </div>
                </td>
              </tr>
              )
            })}
          </tbody>
        </table>

        {/* Mensagem quando nenhum usuário é encontrado na busca */}
        {usuariosFiltrados.length === 0 && (
          <p className="admin-vazio">Nenhum usuário encontrado.</p>
        )}
      </div>
    </Layout>
  )
}
