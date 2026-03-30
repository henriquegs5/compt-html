import { configureStore } from '@reduxjs/toolkit'
import authReducer from './authSlice'
import modulosReducer from './modulosSlice'
import perfilReducer from './perfilSlice'
import chatReducer from './chatSlice'
import estatisticasReducer from './estatisticasSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    modulos: modulosReducer,
    perfil: perfilReducer,
    chat: chatReducer,
    estatisticas: estatisticasReducer,
  },
})
