// O que é o store?
//   É o "banco de dados" da aplicação que fica na memória
//   enquanto o site está aberto. Qualquer componente pode ler
//   ou modificar esses dados sem precisar de props.

// Cada "reducer" cuida de uma fatia (slice) do estado:

import { configureStore } from '@reduxjs/toolkit'
import authReducer         from './authSlice'
import modulosReducer      from './modulosSlice'
import progressoReducer    from './progressoSlice'  // progresso pessoal por usuário
import cursosReducer       from './cursosSlice'   // novo — gerencia cursos e módulos
import perfilReducer       from './perfilSlice'
import chatReducer         from './chatSlice'
import estatisticasReducer from './estatisticasSlice'
import subscriptionReducer from './subscriptionSlice'
// Slice de gerenciamento de usuários — usado no painel admin/moderador
import usersReducer        from './usersSlice'

// essa e a store principal, onde ficam quardados os dados(estado global)
// e os reducers q sao as regras q esses dados podem ser alterados
export const store = configureStore({
  reducer: {
    auth:         authReducer,
    modulos:      modulosReducer,
    progresso:    progressoReducer,  // mapa { moduloId: status } do usuário logado
    cursos:       cursosReducer,       // estado acessado via useSelector(s => s.cursos)
    perfil:       perfilReducer,
    chat:         chatReducer,
    estatisticas: estatisticasReducer,
    subscription: subscriptionReducer,
    // Gerencia lista de usuários e alteração de cargos (admin/moderador)
    users:        usersReducer,
  },
})
