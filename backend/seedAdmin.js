import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/compt')
  .then(async () => {
    console.log('✅ Conectado ao MongoDB. Verificando admin...');

    const adminExists = await User.findOne({ role: 'admin' });
    
    if (!adminExists) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      
      const adminUser = new User({
        name: 'Administrador',
        email: 'admin@compt.com',
        password: hashedPassword,
        role: 'admin',
        bio: 'Administrador geral da plataforma',
        avatarUrl: `https://i.pravatar.cc/80?u=admin_seed`
      });
      
      await adminUser.save();
      console.log('✅ Usuário Admin criado com sucesso! (admin@compt.com / admin123)');
    } else {
      console.log('ℹ️ O administrador já existe no banco de dados.');
    }

    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Erro:', err);
    process.exit(1);
  });
