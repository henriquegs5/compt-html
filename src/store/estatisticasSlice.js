import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { getToken } from './authSlice'
import { API } from '../config'

export const fetchEstatisticas = createAsyncThunk('estatisticas/fetch', async (_, { rejectWithValue }) => {
  const token = getToken()
  if (!token) return rejectWithValue('Usuário não autenticado')
  const res = await fetch(`${API}/estatisticas`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Erro ao buscar estatísticas' }))
    return rejectWithValue(err.error || 'Erro ao buscar estatísticas')
  }
  return await res.json()
})

export const salvarEstatisticas = createAsyncThunk(
  'estatisticas/salvar',
  async ({ cursoId, stats }, { rejectWithValue }) => {
    const token = getToken()
    if (!token) return rejectWithValue('Usuário não autenticado')
    const res = await fetch(`${API}/estatisticas`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ cursoId, stats })
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Erro ao salvar estatísticas' }))
      return rejectWithValue(err.error || 'Erro ao salvar estatísticas')
    }
    return await res.json()
  }
)

const estatisticasSlice = createSlice({
  name: 'estatisticas',
  initialState: {
    items: [],
    status: 'idle',
    erro: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchEstatisticas.pending,  (state) => { state.status = 'loading' })
      .addCase(fetchEstatisticas.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.items = action.payload
      })
      .addCase(fetchEstatisticas.rejected, (state, action) => {
        state.status = 'failed'
        state.erro = action.payload || action.error.message
      })
      .addCase(salvarEstatisticas.fulfilled, (state, action) => {
        const { cursoId, stats } = action.payload
        const idx = state.items.findIndex(i => i.cursoId === cursoId)
        if (idx !== -1) {
          state.items[idx].stats = stats
        }
      })
  }
})

export default estatisticasSlice.reducer
