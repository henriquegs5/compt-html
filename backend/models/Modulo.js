import mongoose from 'mongoose';

const ModuloSchema = new mongoose.Schema({
  _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
  cursoId: { type: String, required: true },
  titulo: { type: String, required: true },
  descricao: { type: String, required: true },
  imagem: { type: String, default: 'default.jpg' },
  link: { type: String, default: '' },
  // Quando true e houver um link de vídeo do YouTube, a capa do módulo passa
  // a ser a thumbnail do próprio vídeo em vez da imagem da pasta /img.
  usarThumbnail: { type: Boolean, default: false },
  status: { type: String, enum: ['locked', 'in-progress', 'completed'], default: 'locked' },
});

// Remove o _id e __v ao retornar JSON e adiciona id
ModuloSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
  }
});

export default mongoose.model('Modulo', ModuloSchema);
