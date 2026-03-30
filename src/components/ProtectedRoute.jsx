import { useSelector } from 'react-redux'
import { Navigate } from 'react-router-dom'

export default function ProtectedRoute({ children }) {
  const isLogado = useSelector(state => state.auth.isLogado)
  if (!isLogado) return <Navigate to="/login" replace />
  return children
}
