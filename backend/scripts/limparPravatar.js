import mongoose from 'mongoose'
import User from '../models/User.js'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/compt'

async function run() {
  await mongoose.connect(MONGO_URI)
  console.log('Conectado ao MongoDB')

  const result = await User.updateMany(
    { avatarUrl: /pravatar|gravatar/i },
    { $unset: { avatarUrl: '' } }
  )

  console.log(`${result.modifiedCount} usuários tiveram o avatar pravatar removido.`)
  await mongoose.disconnect()
}

run().catch(err => {
  console.error(err)
  process.exit(1)
})
