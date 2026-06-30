import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/compt';

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('✅ Conectado ao MongoDB. Iniciando migração de chats...');
    const db = mongoose.connection.db;

    await db.collection('cursos').updateOne({ titulo: 'Fortnite' }, { $set: { chat: 'fortnite' } });
    await db.collection('cursos').updateOne({ titulo: 'Rainbow Six Siege' }, { $set: { chat: 'rainbow' } });
    await db.collection('cursos').updateOne({ titulo: 'Clash Royale' }, { $set: { chat: 'clash' } });
    
    console.log('🎉 Migração de db concluída com sucesso!');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Erro:', err);
    process.exit(1);
  });
