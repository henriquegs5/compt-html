import Canal from './models/Canal.js';

// Garante que os canais padrão existam no banco (idempotente). Roda no
// boot do servidor — assim a Comunidade nunca fica sem os canais originais.
const CANAIS_PADRAO = [
  { nome: 'geral',    label: 'Geral' },
  { nome: 'fortnite', label: 'Fortnite' },
  { nome: 'rainbow',  label: 'Rainbow Six' },
  { nome: 'clash',    label: 'Clash Royale' },
];

export async function seedCanais() {
  for (const canal of CANAIS_PADRAO) {
    // upsert: cria se não existir, não duplica se já existir
    await Canal.updateOne(
      { nome: canal.nome },
      { $setOnInsert: canal },
      { upsert: true }
    );
  }
  console.log('✅ Canais padrão verificados/criados.');
}
