// ============================================================
// store/usersSlice.js
// Slice responsável pelo gerenciamento de usuários (painel admin).
//
// Funcionalidades:
//   - Carregar todos os usuários cadastrados no localStorage
//   - Alterar o cargo (role) de um usuário (somente admin)
//   - Remover um usuário (admin e moderador)
//
// Os dados ficam em localStorage sob a chave "compt_users".
// ============================================================

import { createSlice } from '@reduxjs/toolkit'

// Lê todos os usuários do localStorage e retorna como array
function lerUsuariosDoStorage() {
  try {
    const dados = JSON.parse(localStorage.getItem('compt_users')) || {}
    return Object.values(dados)
  } catch {
    return []
  }
}

// Lê o objeto bruto (chave → usuário) para facilitar atualizações
function lerUsuariosObjeto() {
  try {
    return JSON.parse(localStorage.getItem('compt_users')) || {}
  } catch {
    return {}
  }
}

const usersSlice = createSlice({
  name: 'users',
  initialState: {
    // Lista de todos os usuários cadastrados (carregada sob demanda)
    lista: [],
  },
  reducers: {
    // Carrega todos os usuários do localStorage para o Redux.
    // Chamado quando o admin/moderador abre o painel.
    carregarTodosUsuarios(state) {
      state.lista = lerUsuariosDoStorage()
    },

    // Altera o cargo de um usuário.
    // payload: { uid: string, novoRole: "cliente" | "moderador" }
    // Regra de negócio: somente o admin pode chamar esta action.
    // A verificação de permissão é feita no componente (PainelAdmin).
    alterarCargo(state, action) {
      const { uid, novoRole } = action.payload
      // Atualiza no localStorage
      const users = lerUsuariosObjeto()
      if (users[uid]) {
        users[uid].role = novoRole
        localStorage.setItem('compt_users', JSON.stringify(users))
      }
      // Atualiza no estado Redux para refletir na interface
      const usuario = state.lista.find(u => u.uid === uid)
      if (usuario) {
        usuario.role = novoRole
      }
    },

    // Remove um usuário do sistema.
    // payload: uid (string)
    // Regra: admin e moderador podem remover, mas nunca um admin.
    // A verificação é feita no componente.
    removerUsuario(state, action) {
      const uid = action.payload
      // Remove do localStorage
      const users = lerUsuariosObjeto()
      delete users[uid]
      localStorage.setItem('compt_users', JSON.stringify(users))
      // Remove do estado Redux
      state.lista = state.lista.filter(u => u.uid !== uid)
    },
  },
})

export const { carregarTodosUsuarios, alterarCargo, removerUsuario } = usersSlice.actions
export default usersSlice.reducer
