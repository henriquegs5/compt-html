import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

const API = 'http://localhost:3001'

// Hash simples (mesma lógica do auth.js original)
function hashSenha(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash |= 0
  }
  return hash.toString(16)
}

// Carrega sessão do localStorage ao iniciar
function carregarSessao() {
  try { return JSON.parse(localStorage.getItem('compt_session')) }
  catch { return null }
}

function carregarUsuarios() {
  try { return JSON.parse(localStorage.getItem('compt_users')) || {} }
  catch { return {} }
}

// ---- Thunks ----

export const fazerLogin = createAsyncThunk(
  'auth/fazerLogin',
  async ({ email, senha }, { rejectWithValue }) => {
    const users = carregarUsuarios()
    const user = Object.values(users).find(u => u.email === email.toLowerCase())
    if (!user) return rejectWithValue('E-mail não encontrado.')
    if (user.senha !== hashSenha(senha)) return rejectWithValue('Senha incorreta.')
    const sessao = { uid: user.uid, name: user.name, email: user.email }
    localStorage.setItem('compt_session', JSON.stringify(sessao))
    return sessao
  }
)

export const fazerCadastro = createAsyncThunk(
  'auth/fazerCadastro',
  async ({ nome, email, senha }, { rejectWithValue }) => {
    const users = carregarUsuarios()
    if (Object.values(users).some(u => u.email === email.toLowerCase()))
      return rejectWithValue('Este e-mail já está cadastrado.')
    if (Object.values(users).some(u => u.name.toLowerCase() === nome.toLowerCase()))
      return rejectWithValue('Este nome de usuário já está em uso.')

    const uid = 'user_' + Date.now()
    users[uid] = {
      uid,
      name: nome,
      email: email.toLowerCase(),
      senha: hashSenha(senha),
      bio: 'Jogador competitivo na plataforma Compt.',
      avatarUrl: `https://i.pravatar.cc/80?u=${uid}`,
      criadoEm: new Date().toISOString(),
    }
    localStorage.setItem('compt_users', JSON.stringify(users))
    const sessao = { uid, name: nome, email: email.toLowerCase() }
    localStorage.setItem('compt_session', JSON.stringify(sessao))
    return sessao
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

export const { fazerLogout, limparErro } = authSlice.actions
export default authSlice.reducer
