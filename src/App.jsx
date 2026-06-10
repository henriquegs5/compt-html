// ============================================================
// App.jsx
// Componente raiz da aplicação — define TODAS as rotas.
//
// Como funciona a navegação?
//   O React Router "ouve" a URL do navegador e renderiza o
//   componente certo sem recarregar a página (Single Page App).
//
// Sistema de cargos (roles):
//   - "cliente"    → acesso básico (rotas protegidas padrão)
//   - "moderador"  → acesso ao painel admin (sem alterar cargos)
//   - "admin"      → acesso total (painel admin + alterar cargos)
// ============================================================

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { useEffect } from 'react'
import { verificarSessao } from './store/authSlice'
import Login          from './pages/Login'
import Cadastro       from './pages/Cadastro'
import Cursos         from './pages/Cursos'         // tela inicial: lista de cursos
import ModulosCurso   from './pages/ModulosCurso'   // módulos de um curso específico
import Progressos     from './pages/Progressos'
import Comunidade     from './pages/Comunidade'
import Estatisticas   from './pages/Estatisticas'
import Perfil         from './pages/Perfil'
import Subscription   from './pages/Subscription'
import Config         from './pages/Config'
// Painel de administração — gerenciamento de usuários e cargos
import PainelAdmin    from './pages/PainelAdmin'
import ProtectedRoute from './components/ProtectedRoute'
// RoleRoute — protege rotas que exigem um cargo específico (admin/moderador)
import RoleRoute      from './components/RoleRoute'

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
  const dispatch = useDispatch()

  // Ao iniciar, verifica com o backend se o token salvo ainda é válido.
  // Se estiver expirado (401), o thunk faz logout automático.
  useEffect(() => {
    dispatch(verificarSessao())
  }, [dispatch])

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
        <Route path="/config"
          element={<ProtectedRoute><Config /></ProtectedRoute>}
        />

        {/* ---- Rota do painel de administração ---- */}
        {/* Protegida por RoleRoute: só admin e moderador podem acessar.
            Clientes que tentarem acessar /admin serão redirecionados para /. */}
        <Route path="/admin"
          element={
            <RoleRoute rolesPermitidos={['admin', 'moderador']}>
              <PainelAdmin />
            </RoleRoute>
          }
        />

        {/* Fallback: qualquer URL desconhecida volta para a home */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </BrowserRouter>
  )
}
