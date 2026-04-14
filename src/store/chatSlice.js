import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
//maia
const API = 'http://localhost:3001'

// Busca todas as mensagens do canal atual
export const fetchMensagens = createAsyncThunk(
  'chat/fetchMensagens',
  async (canal) => {
    const res = await fetch(`${API}/mensagens?canal=${canal}`)
    return { canal, mensagens: await res.json() }
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
    canalAtivo: 'geral',
    status: 'idle',
  },
  reducers: {
    setCanal(state, action) {
      state.canalAtivo = action.payload
    },
    addMensagem(state, action) {
      const { canal, mensagem } = action.payload
      state.mensagens[canal].push(mensagem)
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
        state.mensagens[action.payload.canal] = action.payload.mensagens
      })
      .addCase(fetchMensagens.rejected, (state) => { state.status = 'failed' })
  },
})

export const { setCanal, addMensagem ,removerMensagem} = chatSlice.actions
export default chatSlice.reducer
