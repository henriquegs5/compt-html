import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
//maia
const API = 'http://localhost:3001'

// Busca os módulos do back-end
// A rota GET /modulos é protegida por JWT, então precisamos enviar
// o token salvo na sessão (localStorage) no header Authorization.
export const fetchModulos = createAsyncThunk('modulos/fetchModulos', async () => {
  const sessao = JSON.parse(localStorage.getItem('compt_session'))
  const token = sessao ? sessao.token : ''
  const res = await fetch(`${API}/modulos`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  return await res.json()
})

// Atualiza o status de um módulo no back-end
// A rota PATCH /modulos/:id exige JWT (e privilégios de admin/moderador),
// por isso também enviamos o token no header Authorization.
export const setModuloStatus = createAsyncThunk(
  'modulos/setModuloStatus',
  async ({ id, status }) => {
    const sessao = JSON.parse(localStorage.getItem('compt_session'))
    const token = sessao ? sessao.token : ''
    await fetch(`${API}/modulos/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
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
