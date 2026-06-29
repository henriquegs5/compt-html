// ============================================================
// store/authSlice.js
// Gerencia o estado de autenticação global da aplicação.
//
// Fluxo:
//   1. Ao iniciar, carrega a sessão do localStorage (token + dados do user)
//   2. Login/Cadastro → chama o backend, salva token, marca isLogado = true
//   3. Logout → limpa estado e localStorage
//   4. verificarSessao → confirma com o backend se o token ainda é válido;
//      se retornar 401 (expirado), faz logout automático
// ============================================================

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

const API = 'http://localhost:3001'

// Carrega sessão (token e user) do localStorage ao iniciar
function carregarSessao() {
  try { return JSON.parse(localStorage.getItem('compt_session')) }
  catch { return null }
}

// Helper reutilizável: retorna o token JWT ou null.
// Exportado para uso nos outros slices (usersSlice, perfilSlice, etc.)
export function getToken() {
  try {
    const sessao = JSON.parse(localStorage.getItem('compt_session'))
    return sessao ? sessao.token : null
  } catch { return null }
}

// ---- Thunks ----

export const fazerLogin = createAsyncThunk(
  'auth/fazerLogin',
  async ({ email, senha }, { rejectWithValue }) => {
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro no login')

      const sessao = { token: data.token, ...data.user }
      localStorage.setItem('compt_session', JSON.stringify(sessao))
      return sessao
    } catch (err) {
      return rejectWithValue(err.message)
    }
  }
)

export const fazerCadastro = createAsyncThunk(
  'auth/fazerCadastro',
  async ({ nome, email, senha }, { rejectWithValue }) => {
    try {
      const res = await fetch(`${API}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, email, senha })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro no cadastro')

      const sessao = { token: data.token, ...data.user }
      localStorage.setItem('compt_session', JSON.stringify(sessao))
      return sessao
    } catch (err) {
      return rejectWithValue(err.message)
    }
  }
)

// Verifica com o backend se o token salvo ainda é válido.
// Chamado ao iniciar a aplicação (em App.jsx via useEffect).
// Se retornar 401 (expirado/inválido), despacha fazerLogout automaticamente.
export const verificarSessao = createAsyncThunk(
  'auth/verificarSessao',
  async (_, { dispatch, rejectWithValue }) => {
    const token = getToken()
    if (!token) return rejectWithValue('Sem token')
    try {
      const res = await fetch(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.status === 401) {
        // Token expirado ou inválido — força logout
        dispatch(fazerLogout())
        return rejectWithValue('Sessão expirada. Faça login novamente.')
      }
      if (!res.ok) return rejectWithValue('Erro ao verificar sessão')
      // Retorna dados frescos do usuário (nome, role, etc. atualizados)
      return await res.json()
    } catch (err) {
      return rejectWithValue(err.message)
    }
  }
)

// ---- Slice ----

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    usuario:  carregarSessao(),
    isLogado: !!carregarSessao(),
    erro:     null,
    status:   'idle',
  },
  reducers: {
    fazerLogout(state) {
      state.usuario  = null
      state.isLogado = false
      state.erro     = null
      localStorage.removeItem('compt_session')
    },
    limparErro(state) {
      state.erro = null
    },
    // Atualiza o role do usuário logado no Redux e no localStorage.
    // Usado quando o admin altera o cargo de si mesmo.
    atualizarRole(state, action) {
      if (state.usuario) {
        state.usuario.role = action.payload
        localStorage.setItem('compt_session', JSON.stringify(state.usuario))
      }
    },
  },
  extraReducers: (builder) => {
    const pending   = (state) => { state.status = 'loading'; state.erro = null }
    const rejected  = (state, action) => { state.status = 'idle'; state.erro = action.payload }
    const fulfilled = (state, action) => {
      state.status   = 'idle'
      state.usuario  = action.payload
      state.isLogado = true
      state.erro     = null
    }
    builder
      .addCase(fazerLogin.pending,    pending)
      .addCase(fazerLogin.fulfilled,  fulfilled)
      .addCase(fazerLogin.rejected,   rejected)

      .addCase(fazerCadastro.pending,   pending)
      .addCase(fazerCadastro.fulfilled, fulfilled)
      .addCase(fazerCadastro.rejected,  rejected)

      // verificarSessao: atualiza os dados do usuário se o token ainda for válido
      .addCase(verificarSessao.fulfilled, (state, action) => {
        state.isLogado = true
        // Mantém o token existente, atualiza o resto com dados frescos do banco
        state.usuario = { ...state.usuario, ...action.payload }
        localStorage.setItem('compt_session', JSON.stringify(state.usuario))
      })
      // Se falhar (401 ou sem token), o dispatch(fazerLogout()) dentro do thunk
      // já cuida de limpar o estado — não precisamos fazer nada extra aqui.

      // Quando o perfil é salvo (bio/ranks/avatar), refletimos as mudanças no
      // usuário logado também — assim o avatar e o nome na navbar atualizam na
      // hora, sem precisar recarregar a página. Usamos o tipo da action por
      // string para não importar o thunk do perfilSlice (evita import circular).
      .addMatcher(
        (action) => action.type === 'perfil/atualizarPerfilBackend/fulfilled',
        (state, action) => {
          if (state.usuario) {
            state.usuario = { ...state.usuario, ...action.payload }
            localStorage.setItem('compt_session', JSON.stringify(state.usuario))
          }
        }
      )
  },
})

export const { fazerLogout, limparErro, atualizarRole } = authSlice.actions
export default authSlice.reducer
