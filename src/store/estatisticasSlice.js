import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

const API = 'http://localhost:3001'

export const fetchEstatisticas = createAsyncThunk('estatisticas/fetch', async () => {
  const res = await fetch(`${API}/estatisticas`)
  return await res.json()
})

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
      .addCase(fetchEstatisticas.fulfilled,(state, action) => {
        state.status = 'succeeded'
        state.items  = action.payload
      })
      .addCase(fetchEstatisticas.rejected, (state, action) => {
        state.status = 'failed'
        state.erro   = action.error.message
      })
  },
})

export default estatisticasSlice.reducer
