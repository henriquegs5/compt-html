import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { fazerLogin, fazerCadastro, fazerLogout } from './authSlice'

const API = 'http://localhost:3001'

// Obtém o token da sessão
function getToken() {
  const sessao = JSON.parse(localStorage.getItem('compt_session'))
  return sessao ? sessao.token : null
}

export const fetchPerfil = createAsyncThunk(
  'perfil/fetchPerfil',
  async (_, { rejectWithValue }) => {
    const token = getToken()
    if (!token) return rejectWithValue('Nenhum token encontrado')
    try {
      const res = await fetch(`${API}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Erro ao buscar perfil')
      return await res.json()
    } catch (err) {
      return rejectWithValue(err.message)
    }
  }
)

export const atualizarPerfilBackend = createAsyncThunk(
  'perfil/atualizarPerfilBackend',
  async (dados, { rejectWithValue }) => {
    const token = getToken()
    if (!token) return rejectWithValue('Nenhum token encontrado')
    try {
      const res = await fetch(`${API}/auth/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(dados)
      })
      if (!res.ok) throw new Error('Erro ao atualizar perfil')
      return await res.json()
    } catch (err) {
      return rejectWithValue(err.message)
    }
  }
)

// ---- Slice: define o estado global do perfil e como ele muda ----
const perfilSlice = createSlice({
  name: 'perfil',

  initialState: {
    dados:  null,
    status: 'idle',
    erro:   null,
  },

  reducers: {
    deletarPerfil(state) {
      state.dados  = null
      state.status = 'idle'
      state.erro   = null
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchPerfil.pending, (state) => { state.status = 'loading' })
      .addCase(fetchPerfil.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.dados = action.payload
      })
      .addCase(fetchPerfil.rejected, (state, action) => {
        state.status = 'failed'
        state.erro = action.payload
      })
      
      .addCase(atualizarPerfilBackend.fulfilled, (state, action) => {
        state.dados = action.payload
      })

      // LOGIN bem-sucedido → inicializa o perfil com os dados do usuário logado..
      .addCase(fazerLogin.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.dados  = action.payload
      })

      // CADASTRO bem-sucedido → idem ao login: cria o perfil inicial do novo usuário
      .addCase(fazerCadastro.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.dados  = action.payload
      })

      // LOGOUT → limpa o perfil da memória do Redux
      .addCase(fazerLogout, (state) => {
        state.dados  = null
        state.status = 'idle'
      })
  },
})
export const { deletarPerfil } = perfilSlice.actions
export default perfilSlice.reducer
