import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import Login        from './pages/Login'
import Cadastro     from './pages/Cadastro'
import Modulos      from './pages/Modulos'
import Progressos   from './pages/Progressos'
import Comunidade   from './pages/Comunidade'
import Estatisticas from './pages/Estatisticas'
import Perfil       from './pages/Perfil'
import Subscription from './pages/Subscription'
import ProtectedRoute from './components/ProtectedRoute'

function PublicRoute({ children }) {
  const isLogado = useSelector(s => s.auth.isLogado)
  if (isLogado) return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rotas públicas */}
        <Route path="/login"    element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/cadastro" element={<PublicRoute><Cadastro /></PublicRoute>} />

        {/* Rotas protegidas */}
        <Route path="/"             element={<ProtectedRoute><Modulos /></ProtectedRoute>} />
        <Route path="/progressos"   element={<ProtectedRoute><Progressos /></ProtectedRoute>} />
        <Route path="/comunidade"   element={<ProtectedRoute><Comunidade /></ProtectedRoute>} />
        <Route path="/estatisticas" element={<ProtectedRoute><Estatisticas /></ProtectedRoute>} />
        <Route path="/perfil"       element={<ProtectedRoute><Perfil /></ProtectedRoute>} />
        <Route path="/assinatura"   element={<ProtectedRoute><Subscription /></ProtectedRoute>}/>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
