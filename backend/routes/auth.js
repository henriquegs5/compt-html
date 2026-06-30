import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import passport from 'passport';
import rateLimit from 'express-rate-limit';
import User from '../models/User.js';
import { JWT_SECRET } from '../config/env.js';

const router = express.Router();

// Limita tentativas de login por IP para dificultar ataques de força bruta:
// no máximo 10 tentativas a cada 15 minutos. Respostas bem-sucedidas não contam.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: true,
  message: { error: 'Muitas tentativas de login. Tente novamente em alguns minutos.' },
});

// Limite de caracteres para a bio do perfil
const MAX_BIO = 300;

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
      password: hashedPassword
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
router.post('/login', loginLimiter, async (req, res) => {
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

// GET /auth/me - Retorna dados do usuário logado (valida o token)
router.get('/me', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// PATCH /auth/me - Atualiza os dados do próprio perfil (bio, ranks e avatar)
// Só permite editar campos seguros: nunca deixamos o usuário mudar role, email,
// senha, etc. por aqui. Por isso montamos um objeto "updates" apenas com os
// campos permitidos que vieram no corpo da requisição.
router.patch('/me', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const { bio, ranks, avatarUrl } = req.body;

    // Limita o tamanho da bio para não inflar o documento do usuário
    if (typeof bio === 'string' && bio.length > MAX_BIO) {
      return res.status(400).json({ error: `A bio deve ter no máximo ${MAX_BIO} caracteres.` });
    }

    const updates = {};
    if (bio !== undefined) updates.bio = bio;
    if (ranks !== undefined) updates.ranks = ranks;
    if (avatarUrl !== undefined) updates.avatarUrl = avatarUrl;

    // returnDocument: 'after' faz o Mongoose retornar o documento já atualizado
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      { returnDocument: 'after', runValidators: true }
    ).select('-password');

    if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const requireAdminOrMod = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'moderador')) {
    return next();
  }
  res.status(403).json({ error: 'Acesso negado: requer admin ou moderador.' });
};

// Verifica se o usuário tem cargo admin
const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  res.status(403).json({ error: 'Acesso negado: requer admin.' });
};

// GET /auth/users - Lista todos os usuários (admin e moderador)
router.get(
  '/users',
  passport.authenticate('jwt', { session: false }),
  requireAdminOrMod,
  async (req, res) => {
    try {
      const users = await User.find().sort({ criadoEm: -1 });
      res.json(users);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// GET /auth/users/:id - Retorna dados públicos de um usuário (qualquer logado)
router.get(
  '/users/:id',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    try {
      const user = await User.findById(req.params.id);
      if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });

      const { name, avatarUrl, bio, role, criadoEm } = user.toJSON();
      res.json({ name, avatarUrl, bio, role, criadoEm, uid: req.params.id });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// PATCH /auth/users/:id/role - Altera o cargo de um usuário (somente admin)
router.patch(
  '/users/:id/role',
  passport.authenticate('jwt', { session: false }),
  requireAdmin,
  async (req, res) => {
    try {
      const { novoRole } = req.body;

      // Valida o valor recebido
      const rolesValidos = ['cliente', 'moderador'];
      if (!rolesValidos.includes(novoRole)) {
        return res.status(400).json({ error: 'Cargo inválido. Use "cliente" ou "moderador".' });
      }

      // Impede alterar o cargo de um admin
      const alvo = await User.findById(req.params.id);
      if (!alvo) return res.status(404).json({ error: 'Usuário não encontrado.' });
      if (alvo.role === 'admin') {
        return res.status(403).json({ error: 'Não é possível alterar o cargo de um admin.' });
      }

      const updated = await User.findByIdAndUpdate(
        req.params.id,
        { $set: { role: novoRole } },
        { returnDocument: 'after' }
      );
      res.json(updated);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// DELETE /auth/users/:id - Remove um usuário (admin e moderador, nunca admins)
router.delete(
  '/users/:id',
  passport.authenticate('jwt', { session: false }),
  requireAdminOrMod,
  async (req, res) => {
    try {
      const alvo = await User.findById(req.params.id);
      if (!alvo) return res.status(404).json({ error: 'Usuário não encontrado.' });

      // Nunca permite remover um admin
      if (alvo.role === 'admin') {
        return res.status(403).json({ error: 'Não é possível remover um admin.' });
      }

      // Moderador não pode remover outro moderador
      if (req.user.role === 'moderador' && alvo.role === 'moderador') {
        return res.status(403).json({ error: 'Moderador não pode remover outro moderador.' });
      }

      await User.findByIdAndDelete(req.params.id);
      res.json({ message: 'Usuário removido com sucesso.' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

export default router;
