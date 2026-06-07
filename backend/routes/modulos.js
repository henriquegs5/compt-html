import express from 'express';
import passport from 'passport';
import Modulo from '../models/Modulo.js';

const router = express.Router();

// Middleware para verificar se é admin/moderador
const requireAdmin = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'moderador')) {
    next();
  } else {
    res.status(403).json({ error: 'Acesso negado: Requer privilégios de administrador.' });
  }
};

// GET /modulos - Lista todos os módulos
router.get('/', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const modulos = await Modulo.find();
    res.json(modulos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /modulos/:id - Retorna um módulo específico
router.get('/:id', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const modulo = await Modulo.findById(req.params.id);
    if (!modulo) return res.status(404).json({ error: 'Módulo não encontrado' });
    res.json(modulo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /modulos - Cria um novo módulo
router.post('/', passport.authenticate('jwt', { session: false }), requireAdmin, async (req, res) => {
  try {
    const novoModulo = new Modulo(req.body);
    const moduloSalvo = await novoModulo.save();
    res.status(201).json(moduloSalvo);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PATCH /modulos/:id - Atualiza parcialmente um módulo
router.patch('/:id', passport.authenticate('jwt', { session: false }), requireAdmin, async (req, res) => {
  try {
    const moduloAtualizado = await Modulo.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!moduloAtualizado) return res.status(404).json({ error: 'Módulo não encontrado' });
    res.json(moduloAtualizado);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /modulos/:id - Remove um módulo
router.delete('/:id', passport.authenticate('jwt', { session: false }), requireAdmin, async (req, res) => {
  try {
    const moduloDeletado = await Modulo.findByIdAndDelete(req.params.id);
    if (!moduloDeletado) return res.status(404).json({ error: 'Módulo não encontrado' });
    res.json({ message: 'Módulo removido com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
