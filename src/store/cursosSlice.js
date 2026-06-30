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
const reviewsAdapter = createEntityAdapter()

// ---- Thunks ----

/**
 * Busca todos os cursos do servidor.
 * @async
 * @function fetchCursos
 * @returns {Promise<Array>} Array com todos os cursos cadastrados
 */
export const fetchCursos = createAsyncThunk('cursos/fetchCursos', async (_, { rejectWithValue }) => {
  const sessao = JSON.parse(localStorage.getItem('compt_session'));
  const token = sessao ? sessao.token : '';
  const res = await fetch(`${API}/cursos`, {
    headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Erro ao carregar cursos' }))
    return rejectWithValue(err.error || 'Erro ao carregar cursos')
  }
  return await res.json()
})


/**
 * Busca os módulos pertencentes a um curso específico.
 * @async
 * @function fetchModulosDoCurso
 * @param {string} cursoId - O ID do curso para o qual os módulos serão buscados
 * @returns {Promise<Array>} Array de módulos filtrados
 */
export const fetchModulosDoCurso = createAsyncThunk(
  'cursos/fetchModulosDoCurso',
  async (cursoId) => {
    const sessao = JSON.parse(localStorage.getItem('compt_session'));
    const token = sessao ? sessao.token : '';
    const res    = await fetch(`${API}/modulos`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })  // busca todos os módulos
    const todos  = await res.json()
    // filtra apenas os módulos que pertencem ao curso clicado
    return todos.filter(m => m.cursoId === cursoId)
  }
)


/**
 * Atualiza o status de um módulo (ex: locked, in-progress, completed).
 * @async
 * @function setModuloStatusCurso
 * @param {Object} payload - Objeto com id do módulo e o novo status
 * @param {string} payload.id - ID do módulo
 * @param {string} payload.status - Novo status
 * @returns {Promise<Object>} Retorna o id e o status atualizado
 */
export const setModuloStatusCurso = createAsyncThunk(
  'cursos/setModuloStatusCurso',
  async ({ id, status, cursoId }) => {
    const sessao = JSON.parse(localStorage.getItem('compt_session'));
    const token = sessao ? sessao.token : '';
    await fetch(`${API}/modulos/${id}/progresso`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status, cursoId }),
    })
    return { id, status }  // devolve o id (do modulo) e novo status para atualizar o estado local
  }
)

export const fetchProgressoDoCurso = createAsyncThunk(
  'cursos/fetchProgressoDoCurso',
  async (cursoId) => {
    const sessao = JSON.parse(localStorage.getItem('compt_session'));
    const token = sessao ? sessao.token : '';
    const res = await fetch(`${API}/modulos/curso/${cursoId}/progresso`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return await res.json();
  }
)

export const fetchProgressoGeral = createAsyncThunk(
  'cursos/fetchProgressoGeral',
  async () => {
    const sessao = JSON.parse(localStorage.getItem('compt_session'));
    const token = sessao ? sessao.token : '';
    const res = await fetch(`${API}/modulos/meus-progressos`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return await res.json();
  }
)
/**
 * Adiciona um novo curso ao banco de dados.
 * @async
 * @function adicionarCurso
 * @param {Object} cursoData - Dados do novo curso
 * @param {string} cursoData.titulo - Título do curso
 * @param {string} cursoData.descricao - Descrição do curso
 * @param {string} cursoData.imagem - Imagem de capa do curso
 * @returns {Promise<Object>} O curso recém-criado retornado pelo servidor
 */
export const adicionarCurso = createAsyncThunk(
  'cursos/adicionarCurso',
  async ({ titulo, descricao, imagem, pago, preco, horas, comChat, rankingMethods }) => {
    let chat = ''

    if (comChat) {
      const slug = slugify(titulo)
      const token = getToken()
      const canalRes = await fetch(`${API}/canais`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ label: titulo })
      })
      if (canalRes.ok) {
        const canal = await canalRes.json()
        chat = canal.nome
      } else {
        chat = slug
      }
    }

    const novoCurso = {
      id: String(Date.now()),
      titulo,
      descricao,
      imagem: imagem || 'default.jpg',
      pago: pago || false,
      preco: preco || 0,
      horas: horas || 0,
      chat,
      rankingMethods: rankingMethods || []
    }

    const token = getToken()
    const res = await fetch(`${API}/cursos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(novoCurso),
    })

    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Erro ao criar curso')
    return data
  }
)

/**
 * Edita as informações de um curso existente.
 * @async
 * @function editarCurso
 * @param {Object} cursoData - Dados atualizados do curso
 * @param {string} cursoData.id - ID do curso a ser editado
 * @param {string} cursoData.titulo - Título do curso
 * @param {string} cursoData.descricao - Descrição do curso
 * @param {string} cursoData.imagem - Imagem de capa
 * @param {number|string} cursoData.totalModulos - Total de módulos
 * @returns {Promise<Object>} O curso editado retornado pelo servidor
 */
function slugify(texto) {
  return texto
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .trim()
}

function getToken() {
  const s = JSON.parse(localStorage.getItem('compt_session'))
  return s ? s.token : ''
}

export const editarCurso = createAsyncThunk(
  'cursos/editarCurso',
  async ({ id, titulo, descricao, imagem, pago, preco, horas, comChat, rankingMethods }) => {
    let chat = ''

    if (comChat) {
      const slug = slugify(titulo)
      const token = getToken()
      const canalRes = await fetch(`${API}/canais`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ label: titulo })
      })
      if (canalRes.ok) {
        const canal = await canalRes.json()
        chat = canal.nome
      } else {
        const err = await canalRes.json().catch(() => ({}))
        // Se o canal já existe (400), usa o slug mesmo assim
        chat = slug
      }
    }

    const dadosAtualizados = {
      titulo,
      descricao,
      imagem: imagem || 'default.jpg',
      pago,
      preco,
      horas,
      chat,
      rankingMethods: rankingMethods || []
    }

    const token = getToken()
    const res = await fetch(`${API}/cursos/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(dadosAtualizados),
    })

    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Erro ao editar curso')
    return data
  }
)

/**
 * Exclui um curso do banco de dados pelo seu ID.
 * @async
 * @function excluirCurso
 * @param {string} id - ID do curso a ser removido
 * @returns {Promise<string>} O ID do curso removido
 */
export const excluirCurso = createAsyncThunk(
  'cursos/excluirCurso',
  async (id) => {
    const sessao = JSON.parse(localStorage.getItem('compt_session'));
    const token = sessao ? sessao.token : '';
    await fetch(`${API}/cursos/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    })
    return id
  }
)

export const adicionarModulo = createAsyncThunk(
  'cursos/adicionarModulo',
  async ({ cursoId, titulo, descricao, imagem, link, usarThumbnail }) => {
    const novoModulo = {
      id: String(Date.now()),
      cursoId,
      titulo,
      descricao,
      imagem: imagem || 'default.jpg',
      link: link || '',
      usarThumbnail: usarThumbnail || false,
      status: 'locked',
    }
    const sessao = JSON.parse(localStorage.getItem('compt_session'));
    const token = sessao ? sessao.token : '';
    const res = await fetch(`${API}/modulos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(novoModulo),
    })
    return await res.json()
  }
)

export const editarModulo = createAsyncThunk(
  'cursos/editarModulo',
  async ({ id, titulo, descricao, imagem, link, usarThumbnail }) => {
    const dadosAtualizados = {
      titulo,
      descricao,
      imagem: imagem || 'default.jpg',
      link: link || '',
      usarThumbnail: usarThumbnail || false,
    }
    const sessao = JSON.parse(localStorage.getItem('compt_session'));
    const token = sessao ? sessao.token : '';
    const res = await fetch(`${API}/modulos/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(dadosAtualizados),
    })
    return await res.json()
  }
)

export const excluirModulo = createAsyncThunk(
  'cursos/excluirModulo',
  async (id) => {
    const sessao = JSON.parse(localStorage.getItem('compt_session'));
    const token = sessao ? sessao.token : '';
    await fetch(`${API}/modulos/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    })
    return id
  }
)

export const fetchCursosMatriculados = createAsyncThunk(
  'cursos/fetchCursosMatriculados',
  async (_, { rejectWithValue }) => {
    const sessao = JSON.parse(localStorage.getItem('compt_session'));
    const token = sessao ? sessao.token : '';
    if (!token) return rejectWithValue('Usuário não autenticado')
    const res = await fetch(`${API}/cursos/matriculados`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Erro ao buscar matrículas' }))
      return rejectWithValue(err.error || 'Erro ao buscar matrículas')
    }
    return await res.json();
  }
)

export const matricularCurso = createAsyncThunk(
  'cursos/matricularCurso',
  async (cursoId, { rejectWithValue }) => {
    const sessao = JSON.parse(localStorage.getItem('compt_session'));
    const token = sessao ? sessao.token : '';
    const res = await fetch(`${API}/cursos/${cursoId}/matricula`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Erro ao matricular' }))
      return rejectWithValue(err.error || 'Erro ao matricular')
    }
    return cursoId;
  }
)

export const desmatricularCurso = createAsyncThunk(
  'cursos/desmatricularCurso',
  async (cursoId) => {
    const sessao = JSON.parse(localStorage.getItem('compt_session'));
    const token = sessao ? sessao.token : '';
    await fetch(`${API}/cursos/${cursoId}/matricula`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return cursoId;
  }
)

export const fetchReviews = createAsyncThunk(
  'cursos/fetchReviews',
  async (cursoId) => {
    const res = await fetch(`${API}/cursos/${cursoId}/reviews`);
    return await res.json();
  }
)

export const enviarReview = createAsyncThunk(
  'cursos/enviarReview',
  async ({ cursoId, nota, texto }) => {
    const sessao = JSON.parse(localStorage.getItem('compt_session'));
    const token = sessao ? sessao.token : '';
    const res = await fetch(`${API}/cursos/${cursoId}/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ nota, texto })
    });
    return await res.json();
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
    matriculados: [],
    matriculadosStatus: 'idle',

    // Sub-estado dos módulos do curso atualmente aberto (também normalizado)
    modulosDosCurso: modulosAdapter.getInitialState({
      status: 'idle',    // status da requisição de módulos
    }),
    
    // Dicionário de progresso: { "moduloId": "status" }
    progressoDosModulos: {},

    // Array com todos os progressos do usuário
    progressoGeral: [],
    progressoGeralStatus: 'idle',

    reviews: reviewsAdapter.getInitialState({
      status: 'idle',
    })
  }),

  reducers: {
    // Limpa os módulos do curso anterior antes de carregar o novo.
    // Sem isso, ao trocar de curso o usuário veria os módulos antigos
    // piscando na tela enquanto os novos chegam.
    limparModulosCurso(state) {
      modulosAdapter.removeAll(state.modulosDosCurso)
      state.modulosDosCurso.status = 'idle'
      state.progressoDosModulos = {}
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
        state.erro   = action.payload ?? action.error.message
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

      // --- Atualizar status do módulo (progresso) ---
      // Atualiza apenas no dicionário de progresso local
      .addCase(setModuloStatusCurso.fulfilled, (state, action) => {
        const { id, status } = action.payload
        state.progressoDosModulos[id] = status
      })

      // --- Buscar Progresso ---
      .addCase(fetchProgressoDoCurso.fulfilled, (state, action) => {
        const map = {}
        action.payload.forEach(p => {
          map[p.moduloId] = p.status
        })
        state.progressoDosModulos = map
      })

      // --- Buscar Progresso Geral ---
      .addCase(fetchProgressoGeral.pending, (state) => { state.progressoGeralStatus = 'loading' })
      .addCase(fetchProgressoGeral.fulfilled, (state, action) => {
        state.progressoGeralStatus = 'succeeded'
        state.progressoGeral = action.payload
      })
      // --- Adicionar curso ---
      .addCase(adicionarCurso.fulfilled, (state, action) => {
        cursosAdapter.addOne(state, action.payload)
      })

      // --- Editar curso ---
      .addCase(editarCurso.fulfilled, (state, action) => {
        // A rota PATCH devolve o documento cru do curso, cujo totalModulos/
        // avaliações ficam com o valor guardado (0). Esses campos são calculados
        // dinamicamente no GET /cursos, então os removemos do update para não
        // sobrescrever a contagem real que já está no estado.
        const {
          id,
          totalModulos, totalAvaliacoes, mediaAvaliacoes, rascunho,
          ...changes
        } = action.payload
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

      // --- Matriculados ---
      .addCase(fetchCursosMatriculados.pending, (state) => { state.matriculadosStatus = 'loading' })
      .addCase(fetchCursosMatriculados.fulfilled, (state, action) => {
        state.matriculadosStatus = 'succeeded'
        state.matriculados = action.payload || []
      })
      .addCase(fetchCursosMatriculados.rejected, (state) => {
        state.matriculadosStatus = 'failed'
      })
      .addCase(matricularCurso.fulfilled, (state, action) => {
        if (Array.isArray(state.matriculados) && !state.matriculados.includes(action.payload)) {
          state.matriculados.push(action.payload)
        }
      })
      .addCase(desmatricularCurso.fulfilled, (state, action) => {
        if (Array.isArray(state.matriculados)) {
          state.matriculados = state.matriculados.filter(id => id !== action.payload)
        }
      })

      // --- Reviews ---
      .addCase(fetchReviews.pending, (state) => { state.reviews.status = 'loading' })
      .addCase(fetchReviews.fulfilled, (state, action) => {
        state.reviews.status = 'succeeded'
        reviewsAdapter.setAll(state.reviews, action.payload)
      })
      .addCase(enviarReview.fulfilled, (state, action) => {
        reviewsAdapter.upsertOne(state.reviews, action.payload)
      })
      // --- Logout ---
      .addCase('auth/fazerLogout', (state) => {
        state.matriculados = []
        state.matriculadosStatus = 'idle'
        state.progressoDosModulos = {}
        state.progressoGeral = []
        state.progressoGeralStatus = 'idle'
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

export const {
  selectAll: selectAllReviews
} = reviewsAdapter.getSelectors((state) => state.cursos.reviews)
