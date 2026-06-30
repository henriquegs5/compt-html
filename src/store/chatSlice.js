import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { getToken } from './authSlice'
//maia
import { API } from '../config'

// Garante que os "baldes" de estado de um canal existam antes de usá-los.
// Como os canais agora são dinâmicos, não dá para pré-criar tudo no
// initialState — inicializamos sob demanda.
function garantirCanal(state, canal) {
  if (!state.mensagens[canal]) {
    state.mensagens[canal] = []
    state.page[canal] = 1
    state.hasMore[canal] = true
  }
}

// ---- Canais ----

// Lista os canais existentes (público)
export const fetchCanais = createAsyncThunk('chat/fetchCanais', async () => {
  const res = await fetch(`${API}/canais`)
  return await res.json()
})

// Cria um novo canal (admin/moderador)
export const criarCanal = createAsyncThunk(
  'chat/criarCanal',
  async (label, { rejectWithValue }) => {
    const res = await fetch(`${API}/canais`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ label })
    })
    const data = await res.json()
    if (!res.ok) return rejectWithValue(data.error || 'Erro ao criar canal')
    return data
  }
)

// Exclui um canal e suas mensagens (admin/moderador)
export const excluirCanal = createAsyncThunk(
  'chat/excluirCanal',
  async (nome, { rejectWithValue }) => {
    const res = await fetch(`${API}/canais/${nome}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${getToken()}` }
    })
    const data = await res.json()
    if (!res.ok) return rejectWithValue(data.error || 'Erro ao excluir canal')
    return nome
  }
)

// ---- Mensagens ----

// Busca mensagens do canal atual com paginação
export const fetchMensagens = createAsyncThunk(
  'chat/fetchMensagens',
  async ({ canal, page = 1 }) => {
    const res = await fetch(`${API}/mensagens?canal=${canal}&page=${page}`)
    return { canal, page, mensagens: await res.json() }
  }
)

// Envia uma nova mensagem
export const postMensagem = createAsyncThunk(
  'chat/postMensagem',
  async ({ canal, text }) => {
    const res = await fetch(`${API}/mensagens`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`
      },
      body: JSON.stringify({ canal, text })
    })
    return await res.json()
  }
)

// Exclui uma mensagem
export const deleteMensagem = createAsyncThunk(
  'chat/deleteMensagem',
  async ({ id, canal }, { rejectWithValue }) => {
    const res = await fetch(`${API}/mensagens/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${getToken()}` }
    })
    const data = await res.json()
    if (!res.ok) return rejectWithValue(data.error || 'Erro ao excluir mensagem')
    return { id, canal }
  }
)

// Edita uma mensagem
export const editarMensagem = createAsyncThunk(
  'chat/editarMensagem',
  async ({ id, canal, text }, { rejectWithValue }) => {
    const res = await fetch(`${API}/mensagens/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`
      },
      body: JSON.stringify({ text })
    })
    const data = await res.json()
    if (!res.ok) return rejectWithValue(data.error || 'Erro ao editar mensagem')
    // Retorna a mensagem atualizada
    return { canal, mensagem: data }
  }
)

const chatSlice = createSlice({
  name: 'chat',
  initialState: {
    canais: [],          // [{ nome, label }] — vem do backend
    mensagens: {},       // { [nome]: [...] } — inicializado sob demanda
    page: {},            // { [nome]: número da página atual }
    hasMore: {},         // { [nome]: tem mais mensagens antigas? }
    canalAtivo: 'geral',
    status: 'idle',
  },
  reducers: {
    setCanal(state, action) {
      state.canalAtivo = action.payload
    },
    resetCanalPagination(state, action) {
      const canal = action.payload
      state.page[canal] = 1
      state.hasMore[canal] = true
      state.mensagens[canal] = []
    },
  },
  extraReducers: (builder) => {
    builder
      // ---- Canais ----
      .addCase(fetchCanais.fulfilled, (state, action) => {
        state.canais = action.payload
        // Se o canal ativo não existe mais na lista, volta para o primeiro
        const existe = action.payload.some(c => c.nome === state.canalAtivo)
        if (!existe && action.payload.length > 0) {
          state.canalAtivo = action.payload[0].nome
        }
      })
      .addCase(criarCanal.fulfilled, (state, action) => {
        state.canais.push(action.payload)
      })
      .addCase(excluirCanal.fulfilled, (state, action) => {
        const nome = action.payload
        state.canais = state.canais.filter(c => c.nome !== nome)
        // Limpa o estado de mensagens do canal removido
        delete state.mensagens[nome]
        delete state.page[nome]
        delete state.hasMore[nome]
        // Se estava no canal excluído, volta para o 'geral' (ou o primeiro)
        if (state.canalAtivo === nome) {
          state.canalAtivo = state.canais[0]?.nome || 'geral'
        }
      })

      // ---- Mensagens ----
      .addCase(fetchMensagens.pending,  (state) => { state.status = 'loading' })
      .addCase(fetchMensagens.fulfilled, (state, action) => {
        state.status = 'succeeded'
        const { canal, page, mensagens } = action.payload
        garantirCanal(state, canal)

        // Se a página for 1, substitui. Se for > 1, junta no topo da lista.
        if (page === 1) {
          state.mensagens[canal] = mensagens
        } else {
          state.mensagens[canal] = [...mensagens, ...state.mensagens[canal]]
        }

        state.page[canal] = page
        state.hasMore[canal] = mensagens.length === 50
      })
      .addCase(fetchMensagens.rejected, (state) => { state.status = 'failed' })

      // Ao enviar com sucesso, adiciona a mensagem nova no fim da lista do canal
      .addCase(postMensagem.fulfilled, (state, action) => {
        const msg = action.payload
        garantirCanal(state, msg.canal)
        state.mensagens[msg.canal].push(msg)
      })

      // Remove a mensagem da lista local
      .addCase(deleteMensagem.fulfilled, (state, action) => {
        const { id, canal } = action.payload
        if (state.mensagens[canal]) {
          state.mensagens[canal] = state.mensagens[canal].filter(m => m.id !== id)
        }
      })

      // Atualiza a mensagem na lista local
      .addCase(editarMensagem.fulfilled, (state, action) => {
        const { canal, mensagem } = action.payload
        if (state.mensagens[canal]) {
          const index = state.mensagens[canal].findIndex(m => m.id === mensagem.id)
          if (index !== -1) {
            state.mensagens[canal][index] = mensagem
          }
        }
      })
  },
})

export const { setCanal, resetCanalPagination } = chatSlice.actions
export default chatSlice.reducer
