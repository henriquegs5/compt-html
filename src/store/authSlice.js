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

// ============================================================
// Seed do admin padrão
// Garante que sempre exista pelo menos um administrador no sistema.
// Se nenhum usuário com role "admin" existir, cria automaticamente
// um admin com credenciais padrão (admin@compt.com / admin123).
// ============================================================
function seedAdmin() {
  const users = carregarUsuarios()
  // Verifica se já existe algum admin cadastrado
  const jaTemAdmin = Object.values(users).some(u => u.role === 'admin')
  if (!jaTemAdmin) {
    const uid = 'user_admin_seed'
    users[uid] = {
      uid,
      name: 'Administrador',
      email: 'admin@compt.com',
      senha: hashSenha('admin123'),
      bio: 'Administrador da plataforma Compt.',
      avatarUrl: `https://i.pravatar.cc/80?u=${uid}`,
      criadoEm: new Date().toISOString(),
      // Campo role: define o nível de acesso do usuário
      // Valores possíveis: "cliente" | "moderador" | "admin"
      role: 'admin',
    }
    localStorage.setItem('compt_users', JSON.stringify(users))
  }
}

// Executa o seed ao carregar o módulo (garante admin no primeiro acesso)
seedAdmin()

// ---- Thunks ----

export const fazerLogin = createAsyncThunk(
  'auth/fazerLogin',
  async ({ email, senha }, { rejectWithValue }) => {
    const users = carregarUsuarios()
    const user = Object.values(users).find(u => u.email === email.toLowerCase())
    if (!user) return rejectWithValue('E-mail não encontrado.')
    if (user.senha !== hashSenha(senha)) return rejectWithValue('Senha incorreta.')
    // Sessão agora inclui o campo "role" para controle de acesso nas rotas
    const sessao = { uid: user.uid, name: user.name, email: user.email, role: user.role }
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
      // Todo usuário novo começa como "cliente" (acesso básico)
      role: 'cliente',
    }
    localStorage.setItem('compt_users', JSON.stringify(users))
    // Sessão inclui role para que o Redux saiba o cargo imediatamente
    const sessao = { uid, name: nome, email: email.toLowerCase(), role: 'cliente' }
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
