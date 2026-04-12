// ============================================================
// cursosSlice.js
// Gerencia o estado global de CURSOS e MÓDULOS no Redux.
//
// Por que Redux?
//   Qualquer componente da árvore pode ler/alterar esses dados
//   sem precisar passar props manualmente de pai para filho.
// ============================================================

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

// Endereço base do servidor de dados (json-server rodando na porta 3001)
const API = 'http://localhost:3001'

// ------------------------------------------------------------
// THUNK 1 — fetchCursos
// Busca a lista de todos os cursos disponíveis na API.
// createAsyncThunk cuida automaticamente dos estados:
//   pending  → está carregando
//   fulfilled → dados chegaram com sucesso
//   rejected  → deu erro na requisição
// ------------------------------------------------------------
export const fetchCursos = createAsyncThunk('cursos/fetchCursos', async () => {
  const res = await fetch(`${API}/cursos`)
  return await res.json()  // retorna o array de cursos para o fulfilled
})

// ------------------------------------------------------------
// THUNK 2 — fetchModulosDoCurso
// Busca TODOS os módulos e filtra pelo cursoId no cliente.
//
// Por que filtrar no cliente e não com ?cursoId= na URL?
//   O json-server v1 beta tem comportamento instável com filtros
//   por query string em alguns sistemas. Buscar tudo e filtrar
//   localmente é mais confiável e garante que os módulos apareçam.
// ------------------------------------------------------------
export const fetchModulosDoCurso = createAsyncThunk(
  'cursos/fetchModulosDoCurso',
  async (cursoId) => {
    const res    = await fetch(`${API}/modulos`)  // busca todos os módulos
    const todos  = await res.json()
    // filtra apenas os módulos que pertencem ao curso clicado
    return todos.filter(m => m.cursoId === cursoId)
  }
)

// ------------------------------------------------------------
// THUNK 3 — setModuloStatusCurso
// Atualiza o status de um módulo (locked → in-progress → completed)
// usando PATCH para alterar apenas o campo "status" no json-server.
// ------------------------------------------------------------
export const setModuloStatusCurso = createAsyncThunk(
  'cursos/setModuloStatusCurso',
  async ({ id, status }) => {
    await fetch(`${API}/modulos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),  // manda só o campo que mudou
    })
    return { id, status }  // devolve o id e novo status para atualizar o estado local
  }
)

// ------------------------------------------------------------
// SLICE — define o estado inicial e os reducers
// ------------------------------------------------------------
const cursosSlice = createSlice({
  name: 'cursos',

  initialState: {
    items: [],           // lista de cursos vinda da API
    status: 'idle',      // status da requisição de cursos: idle | loading | succeeded | failed

    modulosDosCurso: [], // módulos do curso atualmente aberto
    modulosStatus: 'idle', // status da requisição de módulos

    erro: null,          // guarda mensagem de erro se algo falhar
  },

  reducers: {
    // Limpa os módulos do curso anterior antes de carregar o novo.
    // Sem isso, ao trocar de curso o usuário veria os módulos antigos
    // piscando na tela enquanto os novos chegam.
    limparModulosCurso(state) {
      state.modulosDosCurso = []
      state.modulosStatus   = 'idle'
    },
  },

  extraReducers: (builder) => {
    builder
      // --- Cursos ---
      .addCase(fetchCursos.pending,   (state) => { state.status = 'loading' })
      .addCase(fetchCursos.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.items  = action.payload  // salva os cursos no estado
      })
      .addCase(fetchCursos.rejected,  (state, action) => {
        state.status = 'failed'
        state.erro   = action.error.message
      })

      // --- Módulos do curso ---
      .addCase(fetchModulosDoCurso.pending,   (state) => { state.modulosStatus = 'loading' })
      .addCase(fetchModulosDoCurso.fulfilled, (state, action) => {
        state.modulosStatus    = 'succeeded'
        state.modulosDosCurso  = action.payload  // salva os módulos filtrados
      })
      .addCase(fetchModulosDoCurso.rejected,  (state, action) => {
        state.modulosStatus = 'failed'
        state.erro          = action.error.message
      })

      // --- Atualizar status do módulo ---
      // Quando o PATCH confirma, atualiza o estado local sem precisar
      // fazer uma nova requisição GET (otimistic update local)
      .addCase(setModuloStatusCurso.fulfilled, (state, action) => {
        const { id, status } = action.payload
        const modulo = state.modulosDosCurso.find(m => m.id === id)
        if (modulo) modulo.status = status
      })
  },
})

export const { limparModulosCurso } = cursosSlice.actions
export default cursosSlice.reducer
