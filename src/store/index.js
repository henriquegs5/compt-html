// ============================================================
// store/index.js
// Configura e exporta o store global do Redux.
//
// O que é o store?
//   É o "banco de dados" da aplicação que fica na memória
//   enquanto o site está aberto. Qualquer componente pode ler
//   ou modificar esses dados sem precisar de props.
//
// Cada "reducer" cuida de uma fatia (slice) do estado:
//   auth         → sessão do usuário (login/logout)
//   modulos      → módulos genéricos (usado pela página antiga)
//   cursos       → lista de cursos + módulos por curso (novo)
//   perfil       → dados do perfil do usuário
//   chat         → mensagens da comunidade
//   estatisticas → stats dos jogos do usuário
//   subscription → plano de assinatura
// ============================================================

import { configureStore } from '@reduxjs/toolkit'
import authReducer         from './authSlice'
import modulosReducer      from './modulosSlice'
import cursosReducer       from './cursosSlice'   // novo — gerencia cursos e módulos
import perfilReducer       from './perfilSlice'
import chatReducer         from './chatSlice'
import estatisticasReducer from './estatisticasSlice'
import subscriptionReducer from './subscriptionSlice'

export const store = configureStore({
  reducer: {
    auth:         authReducer,
    modulos:      modulosReducer,
    cursos:       cursosReducer,       // estado acessado via useSelector(s => s.cursos)
    perfil:       perfilReducer,
    chat:         chatReducer,
    estatisticas: estatisticasReducer,
    subscription: subscriptionReducer,
  },
})
