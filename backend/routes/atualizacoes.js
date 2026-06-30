import express from 'express';
import passport from 'passport';
import Update from '../models/Update.js';

const router = express.Router();

const requireAdmin = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'moderador')) {
    return next();
  }
  res.status(403).json({ error: 'Acesso negado: requer admin ou moderador.' });
};

// GET /atualizacoes - lista todas as atualizações (público)
router.get('/', async (req, res) => {
  try {
    const atualizacoes = await Update.find().sort({ createdAt: -1 });
    res.json(atualizacoes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /atualizacoes - cria uma atualização (admin/mod)
router.post('/', passport.authenticate('jwt', { session: false }), requireAdmin, async (req, res) => {
  try {
    const { title, text } = req.body;
    if (!title || !title.trim() || !text || !text.trim()) {
      return res.status(400).json({ error: 'Título e texto são obrigatórios.' });
    }

    const atualizacao = await Update.create({
      title: title.trim(),
      text: text.trim(),
      authorUid: req.user.id,
      authorName: req.user.name
    });

    res.status(201).json(atualizacao);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /atualizacoes/:id - edita uma atualização (admin/mod)
router.put('/:id', passport.authenticate('jwt', { session: false }), requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, text } = req.body;

    const atualizacao = await Update.findById(id);
    if (!atualizacao) {
      return res.status(404).json({ error: 'Atualização não encontrada.' });
    }

    if (title !== undefined) atualizacao.title = title.trim();
    if (text !== undefined) atualizacao.text = text.trim();
    const atualizada = await atualizacao.save();
    res.json(atualizada);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /atualizacoes/:id - exclui uma atualização (admin/mod)
router.delete('/:id', passport.authenticate('jwt', { session: false }), requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const atualizacao = await Update.findByIdAndDelete(id);
    if (!atualizacao) {
      return res.status(404).json({ error: 'Atualização não encontrada.' });
    }
    res.json({ message: 'Atualização removida com sucesso.', id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
