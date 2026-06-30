import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import dns from 'dns';
import path from 'path';
import { fileURLToPath } from 'url';

// Força o uso de DNS público (Google/Cloudflare) para resolver o registro SRV
// do Atlas (mongodb+srv://). Sem isso, alguns DNS de provedor/faculdade recusam
// a consulta SRV e a conexão falha com "querySrv ECONNREFUSED".
dns.setServers(['8.8.8.8', '1.1.1.1']);
import passport from 'passport';
import passportConfig from './config/passport.js';
import authRoutes from './routes/auth.js';
import cursosRoutes from './routes/cursos.js';
import modulosRoutes from './routes/modulos.js';
import mensagensRoutes from './routes/mensagens.js';
import canaisRoutes from './routes/canais.js';
import atualizacoesRoutes from './routes/atualizacoes.js';
import estatisticasRoutes from './routes/estatisticas.js';
import { seedAdmin } from './seedAdmin.js';
import { seedCanais } from './seedCanais.js';

// Carrega o .env a partir da pasta deste arquivo (backend/), e não do
// diretório onde o comando foi executado. Sem isso, ao rodar "npm run api"
// da raiz do projeto, o dotenv não acha backend/.env, o MONGO_URI fica vazio
// e o servidor cai no fallback do Mongo local (localhost:27017).
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 3001;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/compt';

// Middlewares
// CORS: em vez de liberar qualquer origem (cors() puro), só aceitamos chamadas
// vindas de localhost/127.0.0.1 em qualquer porta. Isso cobre o front em dev
// (Vite em 5173, 5174...) e a máquina de quem for rodar o projeto, mas bloqueia
// sites aleatórios da internet. requisições sem origin (ex: Postman) também passam.
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Origem não permitida pelo CORS'));
    }
  }
}));
// Limite maior que o padrão (100kb) porque o avatar enviado pelo usuário
// chega como imagem em base64 (data URL), que ocupa bastante espaço no corpo.
app.use(express.json({ limit: '5mb' }));
app.use(passport.initialize());
passportConfig(passport);

// Conexão com MongoDB Atlas
mongoose.connect(MONGO_URI)
  .then(async () => {
    // Mostra o host real para não dar falsa impressão de estar no Atlas
    const host = mongoose.connection.host;
    const db = mongoose.connection.name;
    console.log(`✅ MongoDB conectado: ${host} (db: ${db})`);
    
    // Cria o usuário admin se ele não existir no banco
    try {
      await seedAdmin();
      await seedCanais();
    } catch (seedErr) {
      console.error('❌ Erro ao semear dados iniciais:', seedErr);
    }
  })
  .catch(err => console.error('❌ Erro ao conectar no MongoDB:', err));

// Rotas reais (MongoDB Atlas)
app.use('/auth', authRoutes);
app.use('/cursos', cursosRoutes);
app.use('/modulos', modulosRoutes);
app.use('/mensagens', mensagensRoutes);
app.use('/canais', canaisRoutes);
app.use('/atualizacoes', atualizacoesRoutes);
app.use('/estatisticas', estatisticasRoutes);

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor backend rodando na porta ${PORT}`);
});
