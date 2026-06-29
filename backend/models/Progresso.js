import mongoose from 'mongoose';

const ProgressoSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  moduloId: { type: String, required: true },
  cursoId: { type: String, required: true },
  status: { type: String, enum: ['locked', 'in-progress', 'completed'], default: 'locked' },
  atualizadoEm: { type: Date, default: Date.now },
});

// Índice único para garantir que um usuário só tem um progresso por módulo
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
