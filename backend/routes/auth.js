import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import passport from 'passport';
import User from '../models/User.js';

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'secret_key_super_segura';

// POST /auth/register - Cadastro de novo usuário
router.post('/register', async (req, res) => {
  try {
    const { nome, email, senha } = req.body;
    
    const emailLower = email.toLowerCase();
    
    // Verifica se já existe
    const existingUser = await User.findOne({ email: emailLower });
    if (existingUser) {
      return res.status(400).json({ error: 'Este e-mail já está cadastrado.' });
    }
    
    // Hash da senha
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(senha, salt);
    
    const newUser = new User({
      name: nome,
      email: emailLower,
      password: hashedPassword,
      avatarUrl: `https://i.pravatar.cc/80?u=user_${Date.now()}`
    });
    
    const savedUser = await newUser.save();
    
    // Gera token JWT
    const payload = { id: savedUser._id, name: savedUser.name, role: savedUser.role };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
    
    res.status(201).json({ token, user: savedUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /auth/login - Autenticação
router.post('/login', async (req, res) => {
  try {
    const { email, senha } = req.body;
    const emailLower = email.toLowerCase();
    
    const user = await User.findOne({ email: emailLower });
    if (!user) {
      return res.status(404).json({ error: 'E-mail não encontrado.' });
    }
    
    // Compara senha
    const isMatch = await bcrypt.compare(senha, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Senha incorreta.' });
    }
    
    const payload = { id: user._id, name: user.name, role: user.role };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
    
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /auth/me - Retorna os dados do usuário autenticado (Perfil)
router.get('/me', passport.authenticate('jwt', { session: false }), (req, res) => {
  res.json(req.user);
});

// PATCH /auth/me - Atualiza o perfil do usuário logado
router.patch('/me', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const { name, bio, ranks } = req.body;
    // Permite que o usuário apenas atualize os próprios dados relevantes
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { $set: { name, bio, ranks } },
      { new: true, runValidators: true }
    );
    res.json(updatedUser);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
