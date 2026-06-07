import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

const API = 'http://localhost:3001'

// Carrega sessão (token e user) do localStorage ao iniciar
function carregarSessao() {
  try { return JSON.parse(localStorage.getItem('compt_session')) }
  catch { return null }
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

// ---- Slice ----

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    usuario: carregarSessao(),
    isLogado: !!carregarSessao(),
    erro: null,
    status: 'idle',
  },
  reducers: {
    fazerLogout(state) {
      state.usuario = null
      state.isLogado = false
      state.erro = null
      localStorage.removeItem('compt_session')
    },
    limparErro(state) {
      state.erro = null
    },
    // Atualiza o role do usuário logado no Redux e no localStorage
    // Usado quando o admin altera o cargo de si mesmo ou quando
    // a sessão precisa refletir uma mudança de cargo
    atualizarRole(state, action) {
      if (state.usuario) {
        state.usuario.role = action.payload
        // Persiste a mudança na sessão do localStorage
        localStorage.setItem('compt_session', JSON.stringify(state.usuario))
      }
    },
  },
  extraReducers: (builder) => {
    const pending  = (state) => { state.status = 'loading'; state.erro = null }
    const rejected = (state, action) => { state.status = 'idle'; state.erro = action.payload }
    const fulfilled = (state, action) => {
      state.status = 'idle'
      state.usuario = action.payload
      state.isLogado = true
      state.erro = null
    }
    builder
      .addCase(fazerLogin.pending,    pending)
      .addCase(fazerLogin.fulfilled,  fulfilled)
      .addCase(fazerLogin.rejected,   rejected)
      .addCase(fazerCadastro.pending,   pending)
      .addCase(fazerCadastro.fulfilled, fulfilled)
      .addCase(fazerCadastro.rejected,  rejected)
  },
})

export const { fazerLogout, limparErro, atualizarRole } = authSlice.actions
export default authSlice.reducer
