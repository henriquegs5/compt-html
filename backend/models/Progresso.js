import mongoose from 'mongoose';

// ============================================================
// Progresso (por usuário)
// Guarda o progresso de UM usuário em UM módulo de um curso.
//
// Antes o status (locked/in-progress/completed) ficava no próprio
// documento do Módulo — ou seja, era GLOBAL: se um usuário concluía
// um módulo, mudava para todo mundo. Agora cada usuário tem o seu
// próprio registro de progresso, isolado dos demais.
// ============================================================
const ProgressoSchema = new mongoose.Schema({
  // A quem este progresso pertence (id do usuário logado)
  userId: { type: String, required: true },
  // Qual módulo este progresso descreve
  moduloId: { type: String, required: true },
  // A qual curso este módulo pertence
  cursoId: { type: String, required: true },
  // Estado do usuário naquele módulo
  status: { type: String, enum: ['locked', 'in-progress', 'completed'], default: 'locked' },
  // Data do último progresso salvo
  atualizadoEm: { type: Date, default: Date.now },
});

// Índice composto único: um usuário só pode ter UM registro por módulo.
// Isso evita duplicatas e deixa o upsert (atualizar-ou-criar) seguro.
ProgressoSchema.index({ userId: 1, moduloId: 1 }, { unique: true });

ProgressoSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
  }
});

export default mongoose.model('Progresso', ProgressoSchema);
