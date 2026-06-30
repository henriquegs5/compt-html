import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { getToken } from './authSlice'
//maia
const API = 'http://localhost:3001'

// Busca os módulos do back-end
// A rota GET /modulos é protegida por JWT, então precisamos enviar
// o token salvo na sessão (localStorage) no header Authorization.
export const fetchModulos = createAsyncThunk('modulos/fetchModulos', async () => {
  const token = getToken()
  const res = await fetch(`${API}/modulos`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  return await res.json()
})

const modulosSlice = createSlice({
  name: 'modulos',
  initialState: {
    items: [],
    status: 'idle',  // 'idle' | 'loading' | 'succeeded' | 'failed'
    erro: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchModulos.pending,  (state) => { state.status = 'loading' })
      .addCase(fetchModulos.fulfilled,(state, action) => {
        state.status = 'succeeded'
        state.items = action.payload
      })
      .addCase(fetchModulos.rejected, (state, action) => {
        state.status = 'failed'
        state.erro = action.error.message
      })
  },
})

export default modulosSlice.reducer
