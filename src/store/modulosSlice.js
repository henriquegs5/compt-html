import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
//maia
const API = 'http://localhost:3001'

// Busca os módulos do back-end mockado
export const fetchModulos = createAsyncThunk('modulos/fetchModulos', async () => {
  const res = await fetch(`${API}/modulos`)
  return await res.json()
})

// Atualiza o status de um módulo no back-end
export const setModuloStatus = createAsyncThunk(
  'modulos/setModuloStatus',
  async ({ id, status }) => {
    await fetch(`${API}/modulos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    return { id, status }
  }
)

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
      .addCase(setModuloStatus.fulfilled, (state, action) => {
        const { id, status } = action.payload
        const modulo = state.items.find(m => m.id === id)
        if (modulo) modulo.status = status
      })
  },
})

export default modulosSlice.reducer
