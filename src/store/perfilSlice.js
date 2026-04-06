import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

// Importamos as actions do authSlice para "escutar" quando o usuário se cadastra ou faz logout
import { fazerCadastro, fazerLogout } from './authSlice'

// Endereço da nossa API falsa (json-server rodando na porta 3001)
const API = 'http://localhost:3001'

// ---- Thunk: busca o perfil do back-end mockado (json-server) ----
// Um "thunk" é uma função assíncrona que o Redux sabe executar
export const fetchPerfil = createAsyncThunk('perfil/fetchPerfil', async () => {
  // Faz um GET em http://localhost:3001/perfil e retorna os dados
  const res = await fetch(`${API}/perfil`)
  return await res.json()
})

// ---- Slice: define o estado global do perfil e como ele muda ----
const perfilSlice = createSlice({
  name: 'perfil',

  // Estado inicial: sem dados, status parado, sem erro
  initialState: {
    dados: null,     // os dados do perfil (nome, bio, avatar...)
    status: 'idle',  // 'idle' | 'loading' | 'succeeded' | 'failed'
    erro: null,      // mensagem de erro, se houver
  },

  // ---- Reducers: ações que mudam o estado do perfil ----
  reducers: {

    // EDITAR PERFIL (Update) — atualiza os dados localmente na memória do Redux
    // Chamado quando o usuário clica em "Salvar" no modal de edição
    updatePerfil(state, action) {
      // Mantém os dados antigos e só substitui os campos enviados (nome, bio, etc.)
      state.dados = { ...state.dados, ...action.payload }
    },

    // DELETAR PERFIL (Delete) — apaga os dados do perfil da memória local do Redux
    // Chamado quando o usuário confirma "Excluir Conta"
    deletarPerfil(state) {
      state.dados = null      // limpa os dados do perfil
      state.status = 'idle'   // volta o status para parado
      state.erro = null       // limpa qualquer erro
    },
  },

  // ---- Extra Reducers: "escuta" ações de outros slices ----
  extraReducers: (builder) => {
    builder
      // Enquanto o fetchPerfil está carregando...
      .addCase(fetchPerfil.pending, (state) => {
        state.status = 'loading'
      })

      // Quando o fetchPerfil termina com sucesso: salva os dados na variável local
      .addCase(fetchPerfil.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.dados = action.payload // dados vindos do json-server
      })

      // Quando o fetchPerfil falha (ex: json-server não está rodando)
      .addCase(fetchPerfil.rejected, (state, action) => {
        state.status = 'failed'
        state.erro = action.error.message
      })

      // CRIAR PERFIL (Create) — escuta quando o CADASTRO é bem-sucedido
      // Assim que o usuário cria a conta, já montamos o perfil dele localmente
      .addCase(fazerCadastro.fulfilled, (state, action) => {
        state.status = 'succeeded'
        // Cria um perfil inicial com os dados do cadastro (variável local no Redux)
        state.dados = {
          id:        action.payload.uid,
          nome:      action.payload.name,
          email:     action.payload.email,
          bio:       'Jogador competitivo na plataforma Compt.',
          avatarUrl: `https://i.pravatar.cc/80?u=${action.payload.uid}`,
        }
      })

      // Quando o usuário faz logout: limpa o perfil da memória do Redux
      .addCase(fazerLogout, (state) => {
        state.dados = null
        state.status = 'idle'
      })
  },
})

// Exporta as actions para serem usadas nos componentes
export const { updatePerfil, deletarPerfil } = perfilSlice.actions

// Exporta o reducer para ser registrado no store (index.js)
export default perfilSlice.reducer
