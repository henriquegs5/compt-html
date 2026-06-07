import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
//maia
const API = 'http://localhost:3001'

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
    const sessao = JSON.parse(localStorage.getItem('compt_session'));
    const token = sessao ? sessao.token : '';
    const res = await fetch(`${API}/mensagens`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ canal, text })
    })
    return await res.json()
  }
)

const chatSlice = createSlice({
  name: 'chat',
  initialState: {
    mensagens: {
      geral: [],
      fortnite: [],
      rainbow: [],
      clash: [],
    },
    // Controle de paginação (qual página atual de cada canal)
    page: {
      geral: 1,
      fortnite: 1,
      rainbow: 1,
      clash: 1,
    },
    // Controle se tem mais mensagens antigas para buscar
    hasMore: {
      geral: true,
      fortnite: true,
      rainbow: true,
      clash: true,
    },
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
    removerMensagem(state,action){
      const{canal,index}=action.payload
      state.mensagens[canal].splice(index,1)
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMensagens.pending,  (state) => { state.status = 'loading' })
      .addCase(fetchMensagens.fulfilled,(state, action) => {
        state.status = 'succeeded'
        const { canal, page, mensagens } = action.payload
        
        // Se a página for 1, substitui. Se for > 1, junta no topo da lista.
        if (page === 1) {
          state.mensagens[canal] = mensagens
        } else {
          state.mensagens[canal] = [...mensagens, ...state.mensagens[canal]]
        }
        
        // Atualiza a página atual e se tem mais conteúdo (se voltou menos de 50, acabou)
        state.page[canal] = page
        state.hasMore[canal] = mensagens.length === 50
      })
      .addCase(fetchMensagens.rejected, (state) => { state.status = 'failed' })
      
      // Ao enviar com sucesso, adicionamos a mensagem nova no fim da lista do canal
      .addCase(postMensagem.fulfilled, (state, action) => {
        const msg = action.payload
        state.mensagens[msg.canal].push(msg)
      })
  },
})

export const { setCanal, resetCanalPagination, removerMensagem } = chatSlice.actions
export default chatSlice.reducer
