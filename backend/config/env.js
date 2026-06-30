import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Carrega o backend/.env de forma confiável (independente de onde o comando
// foi executado). Este módulo deve ser importado antes de qualquer uso de
// process.env, por isso o importamos no topo do passport e das rotas de auth.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Segredo usado para assinar/verificar os tokens JWT.
// Sem fallback inseguro: se não estiver definido, o servidor não sobe — assim
// nunca rodamos com um segredo público/previsível por engano.
export const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error(
    'JWT_SECRET não definido. Crie backend/.env a partir de backend/.env.example.'
  );
}
