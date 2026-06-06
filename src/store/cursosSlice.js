import { createSlice, createAsyncThunk, createEntityAdapter } from '@reduxjs/toolkit'

// Endereço base do servidor de dados (json-server rodando na porta 3001)
const API = 'http://localhost:3001'

// ============================================================
// EntityAdapters
// createEntityAdapter normaliza o estado em { ids: [], entities: {} }
// e fornece métodos prontos (setAll, addOne, updateOne, removeOne...)
// além de selectors pré-construídos (selectAll, selectById, etc.)
// ============================================================
const cursosAdapter  = createEntityAdapter()
const modulosAdapter = createEntityAdapter()

// ---- Thunks ----

export const fetchCursos = createAsyncThunk('cursos/fetchCursos', async () => {
  const res = await fetch(`${API}/cursos`)
  return await res.json()  // retorna o array de cursos para o fulfilled
})


export const fetchModulosDoCurso = createAsyncThunk(
  'cursos/fetchModulosDoCurso',
  async (cursoId) => {
    const res    = await fetch(`${API}/modulos`)  // busca todos os módulos
    const todos  = await res.json()
    // filtra apenas os módulos que pertencem ao curso clicado
    return todos.filter(m => m.cursoId === cursoId)
  }
)


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


export const adicionarCurso = createAsyncThunk(
  'cursos/adicionarCurso',
  async ({ titulo, descricao, imagem, totalModulos }) => {
    const novoCurso = {
      id: String(Date.now()),
      titulo,
      descricao,
      imagem: imagem || 'default.jpg',
      totalModulos: Number(totalModulos) || 0,
    }

    const res = await fetch(`${API}/cursos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(novoCurso),
    })

    return await res.json()
  }
)

export const editarCurso = createAsyncThunk(
  'cursos/editarCurso',
  async ({ id, titulo, descricao, imagem, totalModulos }) => {
    const dadosAtualizados = {
      titulo,
      descricao,
      imagem: imagem || 'default.jpg',
      totalModulos: Number(totalModulos) || 0,
    }

    const res = await fetch(`${API}/cursos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dadosAtualizados),
    })

    return await res.json()
  }
)

export const excluirCurso = createAsyncThunk(
  'cursos/excluirCurso',
  async (id) => {
    await fetch(`${API}/cursos/${id}`, { method: 'DELETE' })
    return id
  }
)

export const adicionarModulo = createAsyncThunk(
  'cursos/adicionarModulo',
  async ({ cursoId, titulo, descricao, imagem, link }) => {
    const novoModulo = {
      id: String(Date.now()),              // id único baseado no timestamp
      cursoId,                             // vincula o módulo ao curso atual
      titulo,
      descricao,
      imagem: imagem || 'default.jpg',
      link: link || '',
      status: 'locked',                    // todo módulo novo começa bloqueado
    }
    const res = await fetch(`${API}/modulos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(novoModulo),
    })
    return await res.json()
  }
)

export const editarModulo = createAsyncThunk(
  'cursos/editarModulo',
  async ({ id, titulo, descricao, imagem, link }) => {
    const dadosAtualizados = {
      titulo,
      descricao,
      imagem: imagem || 'default.jpg',
      link: link || '',
    }
    const res = await fetch(`${API}/modulos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dadosAtualizados),
    })
    return await res.json()
  }
)

export const excluirModulo = createAsyncThunk(
  'cursos/excluirModulo',
  async (id) => {
    await fetch(`${API}/modulos/${id}`, { method: 'DELETE' })
    return id  // devolve o id para o reducer saber qual módulo remover
  }
)

// ============================================================
// Slice
// initialState usa getInitialState() do adapter, que cria:
//   { ids: [], entities: {} }
// Campos extras (status, erro, modulosDosCurso) são passados como argumento.
// modulosDosCurso também é normalizado pelo modulosAdapter.
// ============================================================
const cursosSlice = createSlice({
  name: 'cursos',

  initialState: cursosAdapter.getInitialState({
    status: 'idle',      // status da requisição de cursos: idle | loading | succeeded | failed
    erro: null,          // guarda mensagem de erro se algo falhar

    // Sub-estado dos módulos do curso atualmente aberto (também normalizado)
    modulosDosCurso: modulosAdapter.getInitialState({
      status: 'idle',    // status da requisição de módulos
    }),
  }),

  reducers: {
    // Limpa os módulos do curso anterior antes de carregar o novo.
    // Sem isso, ao trocar de curso o usuário veria os módulos antigos
    // piscando na tela enquanto os novos chegam.
    limparModulosCurso(state) {
      modulosAdapter.removeAll(state.modulosDosCurso)
      state.modulosDosCurso.status = 'idle'
    },
  },

  extraReducers: (builder) => {
    builder
      // --- Cursos ---
      .addCase(fetchCursos.pending,   (state) => { state.status = 'loading' })
      .addCase(fetchCursos.fulfilled, (state, action) => {
        state.status = 'succeeded'
        // setAll substitui toda a coleção normalizada de uma vez
        cursosAdapter.setAll(state, action.payload)
      })
      .addCase(fetchCursos.rejected,  (state, action) => {
        state.status = 'failed'
        state.erro   = action.error.message
      })

      // --- Módulos do curso ---
      .addCase(fetchModulosDoCurso.pending,   (state) => {
        state.modulosDosCurso.status = 'loading'
      })
      .addCase(fetchModulosDoCurso.fulfilled, (state, action) => {
        state.modulosDosCurso.status = 'succeeded'
        // setAll popula o sub-estado normalizado com os módulos filtrados
        modulosAdapter.setAll(state.modulosDosCurso, action.payload)
      })
      .addCase(fetchModulosDoCurso.rejected,  (state, action) => {
        state.modulosDosCurso.status = 'failed'
        state.erro = action.error.message
      })

      // --- Atualizar status do módulo ---
      // Quando o PATCH confirma, atualiza o estado local sem precisar
      // fazer uma nova requisição GET (optimistic update local)
      .addCase(setModuloStatusCurso.fulfilled, (state, action) => {
        const { id, status } = action.payload
        // updateOne recebe { id, changes } — só muda os campos indicados
        modulosAdapter.updateOne(state.modulosDosCurso, { id, changes: { status } })
      })

      // --- Adicionar curso ---
      .addCase(adicionarCurso.fulfilled, (state, action) => {
        cursosAdapter.addOne(state, action.payload)
      })

      // --- Editar curso ---
      .addCase(editarCurso.fulfilled, (state, action) => {
        const { id, ...changes } = action.payload
        cursosAdapter.updateOne(state, { id, changes })
      })

      // --- Excluir curso ---
      // removeOne recebe apenas o id — remove do ids[] e do entities{}
      .addCase(excluirCurso.fulfilled, (state, action) => {
        cursosAdapter.removeOne(state, action.payload)
      })

      // --- Adicionar módulo ---
      .addCase(adicionarModulo.fulfilled, (state, action) => {
        modulosAdapter.addOne(state.modulosDosCurso, action.payload)
      })

      // --- Editar módulo ---
      .addCase(editarModulo.fulfilled, (state, action) => {
        const { id, ...changes } = action.payload
        modulosAdapter.updateOne(state.modulosDosCurso, { id, changes })
      })

      // --- Excluir módulo ---
      .addCase(excluirModulo.fulfilled, (state, action) => {
        modulosAdapter.removeOne(state.modulosDosCurso, action.payload)
      })
  },
})

export const { limparModulosCurso } = cursosSlice.actions
export default cursosSlice.reducer

// ============================================================
// Selectors gerados pelo EntityAdapter
// Os selectors recebem o estado RAIZ (rootState) e encontram
// sozinhos o sub-estado correto pelo path fornecido.
// ============================================================

// Selectors de cursos
export const {
  selectAll:   selectAllCursos,    // retorna array com todos os cursos
  selectById:  selectCursoById,    // retorna um curso pelo id
  selectIds:   selectCursosIds,    // retorna só o array de ids
  selectTotal: selectTotalCursos,  // retorna a quantidade de cursos
} = cursosAdapter.getSelectors((state) => state.cursos)

// Selectors de módulos do curso aberto
export const {
  selectAll:   selectAllModulosDoCurso,   // retorna array com todos os módulos do curso aberto
  selectById:  selectModuloDoCursoById,   // retorna um módulo pelo id
  selectTotal: selectTotalModulosDoCurso, // retorna a quantidade de módulos
} = modulosAdapter.getSelectors((state) => state.cursos.modulosDosCurso)
