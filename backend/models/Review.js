import mongoose from 'mongoose';

const ReviewSchema = new mongoose.Schema({
  cursoId: { type: String, required: true },
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  nota: { type: Number, required: true, min: 0, max: 5 },
  texto: { type: String, default: '' },
  criadoEm: { type: Date, default: Date.now },
});

ReviewSchema.index({ cursoId: 1, userId: 1 }, { unique: true });

ReviewSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
  }
});

export default mongoose.model('Review', ReviewSchema);
