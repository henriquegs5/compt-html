import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
  canal: { type: String, required: true },
  authorUid: { type: String, required: true },
  authorName: { type: String, required: true },
  text: { type: String, required: true, maxlength: 1000 },
  createdAt: { type: Date, default: Date.now }
});

// Remove o _id e __v ao retornar JSON e adiciona id
MessageSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
  }
});

export default mongoose.model('Message', MessageSchema);
