import mongoose from 'mongoose';

const CursoSchema = new mongoose.Schema({
  _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
  titulo: { type: String, required: true },
  descricao: { type: String, required: true },
  imagem: { type: String, default: 'default.jpg' },
  totalModulos: { type: Number, default: 0 },
  pago: { type: Boolean, default: false },
  preco: { type: Number, default: 0 },
  horas: { type: Number, default: 0 },
  criadorId: { type: String, default: null },
  // Canal de chat exibido na página do curso (ex: 'geral', 'fortnite').
  // Vazio = curso sem chat.
  chat: { type: String, default: '' },
});

// Remove o _id e __v ao retornar JSON e adiciona id
CursoSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
  }
});

export default mongoose.model('Curso', CursoSchema);
