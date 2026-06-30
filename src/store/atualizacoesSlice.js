import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { getToken } from './authSlice'

const API = 'http://localhost:3001'

async function parseRes(res) {
  const text = await res.text()
  try {
    return JSON.parse(text)
  } catch {
    throw new Error(`Resposta inesperada do servidor (status ${res.status})`)
  }
}

export const fetchAtualizacoes = createAsyncThunk('atualizacoes/fetch', async () => {
  const res = await fetch(`${API}/atualizacoes`)
  return await parseRes(res)
})

export const criarAtualizacao = createAsyncThunk(
  'atualizacoes/criar',
  async ({ title, text }, { rejectWithValue }) => {
    const res = await fetch(`${API}/atualizacoes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ title, text })
    })
    const data = await parseRes(res)
    if (!res.ok) return rejectWithValue(data.error || 'Erro ao criar atualização')
    return data
  }
)

export const editarAtualizacao = createAsyncThunk(
  'atualizacoes/editar',
  async ({ id, title, text }, { rejectWithValue }) => {
    const res = await fetch(`${API}/atualizacoes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ title, text })
    })
    const data = await parseRes(res)
    if (!res.ok) return rejectWithValue(data.error || 'Erro ao editar atualização')
    return data
  }
)

export const excluirAtualizacao = createAsyncThunk(
  'atualizacoes/excluir',
  async (id, { rejectWithValue }) => {
    const res = await fetch(`${API}/atualizacoes/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${getToken()}` }
    })
    const data = await parseRes(res)
    if (!res.ok) return rejectWithValue(data.error || 'Erro ao excluir atualização')
    return id
  }
)

const atualizacoesSlice = createSlice({
  name: 'atualizacoes',
  initialState: {
    lista: [],
    status: 'idle',
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAtualizacoes.pending, (state) => { state.status = 'loading' })
      .addCase(fetchAtualizacoes.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.lista = action.payload
      })
      .addCase(fetchAtualizacoes.rejected, (state) => { state.status = 'failed' })
      .addCase(criarAtualizacao.fulfilled, (state, action) => {
        state.lista.unshift(action.payload)
      })
      .addCase(editarAtualizacao.fulfilled, (state, action) => {
        const index = state.lista.findIndex(a => a.id === action.payload.id)
        if (index !== -1) state.lista[index] = action.payload
      })
      .addCase(excluirAtualizacao.fulfilled, (state, action) => {
        state.lista = state.lista.filter(a => a.id !== action.payload)
      })
  }
})

export default atualizacoesSlice.reducer
