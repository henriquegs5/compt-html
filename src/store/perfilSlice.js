import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

const API = 'http://localhost:3001'

export const fetchPerfil = createAsyncThunk('perfil/fetchPerfil', async () => {
  const res = await fetch(`${API}/perfil`)
  return await res.json()
})

const perfilSlice = createSlice({
  name: 'perfil',
  initialState: {
    dados: null,
    status: 'idle',
    erro: null,
  },
  reducers: {
    // Atualiza o perfil localmente (sem back-end por enquanto)
    updatePerfil(state, action) {
      state.dados = { ...state.dados, ...action.payload }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPerfil.pending,  (state) => { state.status = 'loading' })
      .addCase(fetchPerfil.fulfilled,(state, action) => {
        state.status = 'succeeded'
        state.dados  = action.payload
      })
      .addCase(fetchPerfil.rejected, (state, action) => {
        state.status = 'failed'
        state.erro   = action.error.message
      })
  },
})

export const { updatePerfil } = perfilSlice.actions
export default perfilSlice.reducer
