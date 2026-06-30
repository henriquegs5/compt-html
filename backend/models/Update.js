import mongoose from 'mongoose';

const UpdateSchema = new mongoose.Schema({
  title: { type: String, required: true },
  text: { type: String, required: true },
  authorUid: { type: String, required: true },
  authorName: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

UpdateSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
  }
});

export default mongoose.model('Update', UpdateSchema);
