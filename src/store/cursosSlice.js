import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

// Endereço base do servidor de dados (json-server rodando na porta 3001)
const API = 'http://localhost:3001'


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

      .addCase(adicionarCurso.fulfilled, (state, action) => {
        state.items.push(action.payload)
      })

     
      .addCase(editarCurso.fulfilled, (state, action) => {
        const index = state.items.findIndex(c => c.id === action.payload.id)
        if (index !== -1) {
          state.items[index] = action.payload
        }
      })

      // --- Excluir curso ---
      // Quando o DELETE confirma, remove o curso do array.
      // action.payload aqui é apenas o id (retornado pela thunk).
      // filter cria um novo array sem o curso daquele id.
      .addCase(excluirCurso.fulfilled, (state, action) => {
        state.items = state.items.filter(c => c.id !== action.payload)
      })

      // --- Adicionar módulo ---
      // Adiciona o módulo criado ao array de módulos do curso aberto.
      .addCase(adicionarModulo.fulfilled, (state, action) => {
        state.modulosDosCurso.push(action.payload)
      })

      // --- Editar módulo ---
      // Substitui o módulo na posição correta do array (pelo id).
      .addCase(editarModulo.fulfilled, (state, action) => {
        const index = state.modulosDosCurso.findIndex(m => m.id === action.payload.id)
        if (index !== -1) {
          state.modulosDosCurso[index] = action.payload
        }
      })

      // --- Excluir módulo ---
      // Remove o módulo do array filtrando pelo id.
      .addCase(excluirModulo.fulfilled, (state, action) => {
        state.modulosDosCurso = state.modulosDosCurso.filter(m => m.id !== action.payload)
      })
  },
})

export const { limparModulosCurso } = cursosSlice.actions
export default cursosSlice.reducer
