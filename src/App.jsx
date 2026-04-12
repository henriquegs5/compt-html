// ============================================================
// App.jsx
// Componente raiz da aplicação — define TODAS as rotas.
//
// Como funciona a navegação?
//   O React Router "ouve" a URL do navegador e renderiza o
//   componente certo sem recarregar a página (Single Page App).
// ============================================================

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import Login          from './pages/Login'
import Cadastro       from './pages/Cadastro'
import Cursos         from './pages/Cursos'         // tela inicial: lista de cursos
import ModulosCurso   from './pages/ModulosCurso'   // módulos de um curso específico
import Progressos     from './pages/Progressos'
import Comunidade     from './pages/Comunidade'
import Estatisticas   from './pages/Estatisticas'
import Perfil         from './pages/Perfil'
import Subscription   from './pages/Subscription'
import ProtectedRoute from './components/ProtectedRoute'

// ------------------------------------------------------------
// PublicRoute — rota que só funciona quando NÃO está logado.
// Se o usuário já estiver logado e tentar acessar /login ou
// /cadastro, redireciona direto para a home (/).
// ------------------------------------------------------------
function PublicRoute({ children }) {
  const isLogado = useSelector(s => s.auth.isLogado)
  if (isLogado) return <Navigate to="/" replace />
  return children
}

// ------------------------------------------------------------
// App — define o mapa completo de rotas da aplicação
// ------------------------------------------------------------
export default function App() {
  return (
    // BrowserRouter ativa o sistema de rotas baseado na URL do navegador
    <BrowserRouter>
      <Routes>

        {/* ---- Rotas públicas (sem login) ---- */}
        {/* PublicRoute garante que usuários logados não fiquem presos aqui */}
        <Route path="/login"    element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/cadastro" element={<PublicRoute><Cadastro /></PublicRoute>} />

        {/* ---- Rotas protegidas (exigem login) ---- */}
        {/* ProtectedRoute redireciona para /login se o usuário não estiver logado */}

        {/* Tela inicial: lista todos os cursos disponíveis */}
        <Route path="/"
          element={<ProtectedRoute><Cursos /></ProtectedRoute>}
        />

        {/* Módulos de um curso — :cursoId é dinâmico na URL
            Ex: /cursos/1 → Fortnite | /cursos/2 → LoL */}
        <Route path="/cursos/:cursoId"
          element={<ProtectedRoute><ModulosCurso /></ProtectedRoute>}
        />

        <Route path="/progressos"
          element={<ProtectedRoute><Progressos /></ProtectedRoute>}
        />
        <Route path="/comunidade"
          element={<ProtectedRoute><Comunidade /></ProtectedRoute>}
        />
        <Route path="/estatisticas"
          element={<ProtectedRoute><Estatisticas /></ProtectedRoute>}
        />
        <Route path="/perfil"
          element={<ProtectedRoute><Perfil /></ProtectedRoute>}
        />
        <Route path="/assinatura"
          element={<ProtectedRoute><Subscription /></ProtectedRoute>}
        />

        {/* Fallback: qualquer URL desconhecida volta para a home */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </BrowserRouter>
  )
}
