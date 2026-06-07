import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Curso from './models/Curso.js';
import Modulo from './models/Modulo.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Lê o db.json original do frontend
const dbPath = path.resolve(__dirname, '../db.json');
const dbData = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/compt')
  .then(async () => {
    console.log('✅ Conectado ao MongoDB. Iniciando migração de dados...');

    // Limpa o banco antes de popular
    await Curso.deleteMany();
    await Modulo.deleteMany();

    // Insere os cursos (temos que mapear 'id' para '_id' se quisermos manter a mesma string, 
    // ou apenas inserir os dados e deixar o Mongo criar novos ObjectIds. 
    // Como o frontend usa os IDs pra buscar módulos, precisamos manter os IDs antigos!
    const cursosParaInserir = dbData.cursos.map(c => {
      const { id, ...resto } = c;
      return { _id: id, ...resto };
    });

    const modulosParaInserir = dbData.modulos.map(m => {
      const { id, ...resto } = m;
      return { _id: id, ...resto };
    });

    await Curso.insertMany(cursosParaInserir);
    console.log(`✅ ${cursosParaInserir.length} cursos inseridos.`);

    await Modulo.insertMany(modulosParaInserir);
    console.log(`✅ ${modulosParaInserir.length} módulos inseridos.`);

    console.log('🎉 Migração concluída com sucesso!');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Erro:', err);
    process.exit(1);
  });
