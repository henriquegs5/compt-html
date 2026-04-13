// ============================================================
// components/RoleRoute.jsx
// Componente de proteção de rota baseado no cargo (role) do usuário.
//
// Uso:
//   <RoleRoute rolesPermitidos={["admin", "moderador"]}>
//     <PainelAdmin />
//   </RoleRoute>
//
// Se o usuário não estiver logado → redireciona para /login
// Se o usuário não tiver o cargo necessário → redireciona para /
// ============================================================

import { useSelector } from 'react-redux'
import { Navigate } from 'react-router-dom'

export default function RoleRoute({ children, rolesPermitidos }) {
  const usuario = useSelector(state => state.auth.usuario)
  const isLogado = useSelector(state => state.auth.isLogado)

  // Se não está logado, manda para o login
  if (!isLogado) return <Navigate to="/login" replace />

  // Verifica se o cargo do usuário está na lista de cargos permitidos
  // Se não tiver permissão, redireciona para a home
  if (!rolesPermitidos.includes(usuario?.role)) {
    return <Navigate to="/" replace />
  }

  // Usuário tem permissão — renderiza o conteúdo da rota
  return children
}
