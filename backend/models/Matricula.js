import mongoose from 'mongoose';

const MatriculaSchema = new mongoose.Schema({
  cursoId: { type: String, required: true },
  userId: { type: String, required: true },
  criadoEm: { type: Date, default: Date.now },
});

MatriculaSchema.index({ cursoId: 1, userId: 1 }, { unique: true });

MatriculaSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
  }
});

export default mongoose.model('Matricula', MatriculaSchema);
