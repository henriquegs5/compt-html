import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['cliente', 'moderador', 'admin'], default: 'cliente' },
  bio: { type: String, default: 'Jogador competitivo na plataforma Compt.' },
  avatarUrl: { type: String },
  ranks: {
    type: [
      {
        jogo: String,
        rank: String,
      }
    ],
    default: [
      { jogo: 'Fortnite', rank: '' },
      { jogo: 'League of Legends', rank: '' },
      { jogo: 'Rainbow Six Siege', rank: '' },
      { jogo: 'Clash Royale', rank: '' },
    ]
  },
  criadoEm: { type: Date, default: Date.now },
});

// Formata a saída JSON
UserSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    ret.uid = ret._id.toString();
    delete ret._id;
    delete ret.password; // Nunca retornar a senha no JSON
  }
});

export default mongoose.model('User', UserSchema);
