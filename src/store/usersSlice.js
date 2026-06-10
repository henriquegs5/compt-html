// ============================================================
// store/usersSlice.js
// Gerencia a lista de usuários do painel admin/moderador.
//
// Os dados agora vêm do MongoDB via API (não mais do localStorage).
// Rotas do backend utilizadas:
//   GET    /auth/users          → lista todos os usuários
//   PATCH  /auth/users/:id/role → altera o cargo de um usuário (só admin)
//   DELETE /auth/users/:id      → remove um usuário (admin e moderador)
// ============================================================

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

const API = 'http://localhost:3001'

// Obtém o token JWT da sessão salva no localStorage
function getToken() {
  try {
    const sessao = JSON.parse(localStorage.getItem('compt_session'))
    return sessao ? sessao.token : null
  } catch {
    return null
  }
}

// ---- Thunks ----

// Carrega todos os usuários do banco (admin e moderador)
export const carregarTodosUsuarios = createAsyncThunk(
  'users/carregarTodosUsuarios',
  async (_, { rejectWithValue }) => {
    const token = getToken()
    if (!token) return rejectWithValue('Sem token de autenticação.')
    try {
      const res = await fetch(`${API}/auth/users`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao buscar usuários.')
      return data
    } catch (err) {
      return rejectWithValue(err.message)
    }
  }
)

// Altera o cargo de um usuário (somente admin)
// payload: { uid: string, novoRole: 'cliente' | 'moderador' }
export const alterarCargo = createAsyncThunk(
  'users/alterarCargo',
  async ({ uid, novoRole }, { rejectWithValue }) => {
    const token = getToken()
    if (!token) return rejectWithValue('Sem token de autenticação.')
    try {
      const res = await fetch(`${API}/auth/users/${uid}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ novoRole }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao alterar cargo.')
      // Retorna uid + novoRole para atualizar o estado sem refetch completo
      return { uid, novoRole }
    } catch (err) {
      return rejectWithValue(err.message)
    }
  }
)

// Remove um usuário do sistema (admin e moderador, nunca admins)
// payload: uid (string)
export const removerUsuario = createAsyncThunk(
  'users/removerUsuario',
  async (uid, { rejectWithValue }) => {
    const token = getToken()
    if (!token) return rejectWithValue('Sem token de autenticação.')
    try {
      const res = await fetch(`${API}/auth/users/${uid}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao remover usuário.')
      return uid // devolve o uid para o reducer remover da lista
    } catch (err) {
      return rejectWithValue(err.message)
    }
  }
)

// ---- Slice ----

const usersSlice = createSlice({
  name: 'users',
  initialState: {
    lista:  [],
    status: 'idle',  // idle | loading | succeeded | failed
    erro:   null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // --- Carregar usuários ---
      .addCase(carregarTodosUsuarios.pending, (state) => {
        state.status = 'loading'
        state.erro   = null
      })
      .addCase(carregarTodosUsuarios.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.lista  = action.payload
      })
      .addCase(carregarTodosUsuarios.rejected, (state, action) => {
        state.status = 'failed'
        state.erro   = action.payload
      })

      // --- Alterar cargo ---
      .addCase(alterarCargo.fulfilled, (state, action) => {
        const { uid, novoRole } = action.payload
        // Atualiza localmente sem precisar refazer o GET completo
        const usuario = state.lista.find(u => u.uid === uid)
        if (usuario) usuario.role = novoRole
      })

      // --- Remover usuário ---
      .addCase(removerUsuario.fulfilled, (state, action) => {
        state.lista = state.lista.filter(u => u.uid !== action.payload)
      })
  },
})

export default usersSlice.reducer
