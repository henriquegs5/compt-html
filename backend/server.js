import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import passport from 'passport';
import passportConfig from './config/passport.js';
import authRoutes from './routes/auth.js';
import cursosRoutes from './routes/cursos.js';
import modulosRoutes from './routes/modulos.js';
import mensagensRoutes from './routes/mensagens.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/compt';

// Middlewares
app.use(cors());
app.use(express.json());
app.use(passport.initialize());
passportConfig(passport);

// Conexão com MongoDB
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB conectado com sucesso!'))
  .catch(err => console.error('❌ Erro ao conectar no MongoDB:', err));

// Rotas Mongoose
app.use('/auth', authRoutes);
app.use('/cursos', cursosRoutes);
app.use('/modulos', modulosRoutes);
app.use('/mensagens', mensagensRoutes);

// Rotas Mockadas (Lidas do db.json) para manter compatibilidade com o frontend
app.get('/mensagens', (req, res) => {
  const dbPath = path.resolve(__dirname, '../db.json');
  const dbData = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  const canal = req.query.canal;
  let mensagens = dbData.mensagens;
  if (canal) {
    mensagens = mensagens.filter(m => m.canal === canal);
  }
  res.json(mensagens);
});

app.get('/estatisticas', (req, res) => {
  const dbPath = path.resolve(__dirname, '../db.json');
  const dbData = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  res.json(dbData.estatisticas);
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor backend rodando na porta ${PORT}`);
});
