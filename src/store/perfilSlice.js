import { createSlice } from '@reduxjs/toolkit'

// Importamos as actions do authSlice para "escutar" login, cadastro e logout
import { fazerLogin, fazerCadastro, fazerLogout } from './authSlice'

// Lista dos jogos disponíveis para preencher rank.
// Cada jogo começa com rank vazio — o usuário preenche pelo modal de edição.
const JOGOS_PADRAO = [
  { jogo: 'Fortnite',            rank: '' },
  { jogo: 'League of Legends',   rank: '' },
  { jogo: 'Rainbow Six Siege',   rank: '' },
  { jogo: 'Clash Royale',        rank: '' },
]

// Monta o objeto de perfil inicial a partir dos dados do usuário autenticado.
// Chamado tanto no login quanto no cadastro para garantir que o perfil
// sempre reflita o usuário que está logado — nunca dados hardcoded.
function montarPerfilInicial(usuario) {
  return {
    id:        usuario.uid,
    nome:      usuario.name,
    email:     usuario.email,
    bio:       'Jogador competitivo na plataforma Compt.',
    // Avatar gerado pelo uid — garante imagem única por usuário
    avatarUrl: `https://i.pravatar.cc/80?u=${usuario.uid}`,
    // Ranks começam vazios; o usuário preenche depois pelo modal de edição
    ranks: JOGOS_PADRAO.map(r => ({ ...r })),
  }
}

// Tenta montar o perfil a partir da sessão já salva no localStorage.
// Isso é necessário porque ao recarregar a página o Redux reinicia do zero,
// mas o usuário pode já estar logado (sessão persistida).
// Sem isso, o perfil ficaria em loading infinito após um refresh.
function montarPerfilDaSessao() {
  try {
    const sessao = JSON.parse(localStorage.getItem('compt_session'))
    if (!sessao) return null
    return montarPerfilInicial(sessao)
  } catch {
    return null
  }
}

// ---- Slice: define o estado global do perfil e como ele muda ----
const perfilSlice = createSlice({
  name: 'perfil',

  initialState: {
    // Se já existe sessão salva, inicializa o perfil direto — sem tela de loading.
    // Mesmo comportamento do authSlice que lê carregarSessao() no initialState.
    dados:  montarPerfilDaSessao(),
    status: montarPerfilDaSessao() ? 'succeeded' : 'idle',
    erro:   null,
  },

  // ---- Reducers: ações que mudam o estado do perfil ----
  reducers: {

    // EDITAR PERFIL (Update) — atualiza os dados localmente na memória do Redux.
    // action.payload pode conter: nome, bio e/ou ranks (array de objetos)
    updatePerfil(state, action) {
      // Mantém os dados antigos e só substitui os campos enviados
      state.dados = { ...state.dados, ...action.payload }
    },

    // DELETAR PERFIL (Delete) — apaga os dados do perfil da memória local do Redux.
    // Chamado quando o usuário confirma "Excluir Conta"
    deletarPerfil(state) {
      state.dados  = null
      state.status = 'idle'
      state.erro   = null
    },
  },

  // ---- Extra Reducers: "escuta" ações de outros slices ----
  extraReducers: (builder) => {
    builder

      // LOGIN bem-sucedido → inicializa o perfil com os dados do usuário logado.
      // Isso garante que o perfil sempre mostre o nome e avatar corretos,
      // em vez de carregar um perfil genérico hardcoded do json-server.
      .addCase(fazerLogin.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.dados  = montarPerfilInicial(action.payload)
      })

      // CADASTRO bem-sucedido → idem ao login: cria o perfil inicial do novo usuário
      .addCase(fazerCadastro.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.dados  = montarPerfilInicial(action.payload)
      })

      // LOGOUT → limpa o perfil da memória do Redux
      .addCase(fazerLogout, (state) => {
        state.dados  = null
        state.status = 'idle'
      })
  },
})

// Exporta as actions para serem usadas nos componentes
export const { updatePerfil, deletarPerfil } = perfilSlice.actions

// Exporta o reducer para ser registrado no store (index.js)
export default perfilSlice.reducer
