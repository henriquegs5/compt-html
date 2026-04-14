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
// THUNK 4 — adicionarCurso
// Cria um novo curso no banco (json-server) via requisição POST.
//
// Quem chama?
//   Apenas admin e moderador — o botão "+" só aparece para eles
//   na tela de Cursos (Cursos.jsx faz essa verificação).
//
// Fluxo completo:
//   1. O usuário clica no card "+" na grade de cursos
//   2. Preenche o formulário do modal (título, descrição, etc.)
//   3. Ao enviar, esta thunk é disparada com os dados do formulário
//   4. A thunk monta o objeto e envia POST para /cursos no json-server
//   5. O json-server grava no arquivo db.json e devolve o curso criado
//   6. O reducer .fulfilled adiciona o curso ao estado Redux
//   7. Como o componente "escuta" o estado via useSelector, a grade
//      re-renderiza automaticamente mostrando o novo curso
// ------------------------------------------------------------
export const adicionarCurso = createAsyncThunk(
  'cursos/adicionarCurso',
  // O parâmetro recebe os dados do formulário via destructuring
  async ({ titulo, descricao, imagem, totalModulos }) => {
    // Monta o objeto do novo curso seguindo o MESMO formato que já existe
    // no db.json (importante para consistência com os cursos antigos)
    const novoCurso = {
      // id único baseado no timestamp atual (ex: "1744617823456").
      // Date.now() retorna milissegundos desde 1970 — praticamente impossível
      // de duplicar em criações manuais. Convertido para string pois o
      // db.json usa ids como string ("1", "2", etc.)
      id: String(Date.now()),
      titulo,
      descricao,
      // Se o usuário não digitou imagem, usa "default.jpg" como fallback.
      // O operador || retorna o valor da direita quando o da esquerda é
      // "falsy" (vazio, null, undefined)
      imagem: imagem || 'default.jpg',
      // Number(...) converte a string do input em número.
      // Se o valor for inválido (NaN), o || 0 garante que vira 0
      totalModulos: Number(totalModulos) || 0,
    }

    // Faz a requisição HTTP POST para o json-server.
    // POST = criar um novo recurso (diferente de GET=ler, PATCH=atualizar)
    const res = await fetch(`${API}/cursos`, {
      method: 'POST',
      // Informa ao servidor que estamos mandando JSON no corpo da requisição
      headers: { 'Content-Type': 'application/json' },
      // JSON.stringify transforma o objeto JavaScript em texto JSON
      body: JSON.stringify(novoCurso),
    })

    // Espera a resposta do servidor e converte o JSON recebido em objeto.
    // O json-server devolve o curso criado (útil caso ele adicione campos)
    return await res.json()
    // ↑ Este valor vira o action.payload no .fulfilled do reducer abaixo
  }
)

// ------------------------------------------------------------
// THUNK 5 — editarCurso
// Atualiza um curso existente via PATCH no json-server.
//
// Por que PATCH e não PUT?
//   PATCH envia só os campos que mudaram, mantendo os outros.
//   PUT substituiria o objeto inteiro — se esquecêssemos um campo,
//   ele seria perdido. PATCH é mais seguro para edição parcial.
//
// Fluxo:
//   1. Admin/moderador clica em "Editar" em um card de curso
//   2. Modal abre com os dados atuais pré-preenchidos
//   3. Usuário altera o que quiser e salva
//   4. Esta thunk envia PATCH /cursos/:id com os novos dados
//   5. O reducer .fulfilled atualiza o curso na lista do Redux
// ------------------------------------------------------------
export const editarCurso = createAsyncThunk(
  'cursos/editarCurso',
  // Recebe o id do curso + os campos alterados
  async ({ id, titulo, descricao, imagem, totalModulos }) => {
    // Monta apenas os campos que serão atualizados
    const dadosAtualizados = {
      titulo,
      descricao,
      imagem: imagem || 'default.jpg',
      totalModulos: Number(totalModulos) || 0,
    }

    // PATCH /cursos/:id — atualiza o curso específico no db.json
    const res = await fetch(`${API}/cursos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dadosAtualizados),
    })

    // Devolve o curso atualizado (com id) para o reducer
    return await res.json()
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

      // --- Adicionar novo curso ---
      // Executa quando a thunk "adicionarCurso" termina com SUCESSO.
      //
      // action.payload = o curso retornado pelo json-server no passo final
      //                  do thunk (o return await res.json()).
      //
      // state.items.push(...) adiciona o novo curso no FINAL do array.
      // Isso garante que o card recém-criado apareça logo antes do
      // card "+" (que é renderizado depois da lista no JSX).
      //
      // Observação: normalmente mutar o estado diretamente é proibido
      // no Redux, mas o Redux Toolkit usa Immer por trás e faz essa
      // mutação virar uma atualização imutável automaticamente.
      .addCase(adicionarCurso.fulfilled, (state, action) => {
        state.items.push(action.payload)
      })

      // --- Editar curso existente ---
      // Quando o PATCH é bem-sucedido, encontra o curso na lista pelo id
      // e substitui pelos dados atualizados.
      //
      // findIndex retorna a POSIÇÃO do item no array (ou -1 se não achar).
      // Usamos splice(index, 1, novoItem) para trocar o item exato
      // naquela posição, mantendo a ordem da lista.
      .addCase(editarCurso.fulfilled, (state, action) => {
        const index = state.items.findIndex(c => c.id === action.payload.id)
        if (index !== -1) {
          state.items[index] = action.payload
        }
      })
  },
})

export const { limparModulosCurso } = cursosSlice.actions
export default cursosSlice.reducer
