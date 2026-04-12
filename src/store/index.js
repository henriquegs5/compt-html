import { configureStore } from '@reduxjs/toolkit'
import authReducer from './authSlice'
import modulosReducer from './modulosSlice'
import perfilReducer from './perfilSlice'
import chatReducer from './chatSlice'
import estatisticasReducer from './estatisticasSlice'
import subscriptionReducer from "./subscriptionSlice"

// essa e a store principal, onde ficam quardados os dados(estado global) 
// e os reducers q sao as regras q esses dados podem ser alterados
export const store = configureStore({
  reducer: {
    auth: authReducer,
    modulos: modulosReducer,
    perfil: perfilReducer,
    chat: chatReducer,
    estatisticas: estatisticasReducer,
    subscription: subscriptionReducer,
  },
})
