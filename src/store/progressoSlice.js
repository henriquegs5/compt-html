import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { getToken } from './authSlice'

// Gerencia o progresso PESSOAL do usuário logado nos módulos.
// O estado é um mapa { moduloId: status }, que as telas usam para
// sobrepor o status do usuário em cima dos módulos vindos da API.
const API = 'http://localhost:3001'

// Busca todos os progressos do usuário logado.
// A rota é protegida por JWT, então enviamos o token no header.
export const fetchProgressos = createAsyncThunk(
  'progresso/fetchProgressos',
  async () => {
    const res = await fetch(`${API}/progressos`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    })
    return await res.json()   // { moduloId: status, ... }
  }
)

// Grava (cria ou atualiza) o progresso do usuário num módulo.
// O backend usa req.user.id, então cada um só altera o próprio progresso.
export const setProgresso = createAsyncThunk(
  'progresso/setProgresso',
  async ({ moduloId, status }) => {
    const res = await fetch(`${API}/progressos/${moduloId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify({ status }),
    })
    return await res.json()    // { moduloId, status }
  }
)

const progressoSlice = createSlice({
  name: 'progresso',
  initialState: {
    byModulo: {},      // mapa { moduloId: status }
    status: 'idle',
  },
  reducers: {
    // Limpa o progresso ao fazer logout (evita vazar dados entre contas)
    limparProgresso(state) {
      state.byModulo = {}
      state.status = 'idle'
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProgressos.pending,   (state) => { state.status = 'loading' })
      .addCase(fetchProgressos.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.byModulo = action.payload || {}
      })
      .addCase(fetchProgressos.rejected,  (state) => { state.status = 'failed' })

      // Ao gravar, atualiza só a entrada daquele módulo no mapa local
      .addCase(setProgresso.fulfilled, (state, action) => {
        const { moduloId, status } = action.payload
        state.byModulo[moduloId] = status
      })
  },
})

export const { limparProgresso } = progressoSlice.actions
export default progressoSlice.reducer
