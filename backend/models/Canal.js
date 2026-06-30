import mongoose from 'mongoose';

// Um canal de chat da Comunidade. "nome" é o identificador usado nas mensagens
// (slug, ex: 'fortnite'); "label" é o texto exibido (ex: 'Fortnite').
const CanalSchema = new mongoose.Schema({
  nome: { type: String, required: true, unique: true },
  label: { type: String, required: true },
  criadoEm: { type: Date, default: Date.now },
});

CanalSchema.set('toJSON', {
  versionKey: false,
  transform: function (doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
  }
});

export default mongoose.model('Canal', CanalSchema);
