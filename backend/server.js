import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import passport from 'passport';
import passportConfig from './config/passport.js';
import authRoutes from './routes/auth.js';
import cursosRoutes from './routes/cursos.js';
import modulosRoutes from './routes/modulos.js';
import mensagensRoutes from './routes/mensagens.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/compt';

// Middlewares
app.use(cors());
app.use(express.json());
app.use(passport.initialize());
passportConfig(passport);

// Conexão com MongoDB Atlas
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB Atlas conectado com sucesso!'))
  .catch(err => console.error('❌ Erro ao conectar no MongoDB:', err));

// Rotas reais (MongoDB Atlas)
app.use('/auth', authRoutes);
app.use('/cursos', cursosRoutes);
app.use('/modulos', modulosRoutes);
app.use('/mensagens', mensagensRoutes);

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor backend rodando na porta ${PORT}`);
});
