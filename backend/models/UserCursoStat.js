import mongoose from 'mongoose';

const UserCursoStatSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  cursoId: { type: String, required: true },
  stats: { type: [{ nome: String, valor: String, publico: { type: Boolean, default: false } }], default: [] },
});

UserCursoStatSchema.index({ userId: 1, cursoId: 1 }, { unique: true });

UserCursoStatSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
  }
});

export default mongoose.model('UserCursoStat', UserCursoStatSchema);
