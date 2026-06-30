import express from 'express';
import passport from 'passport';
import Canal from '../models/Canal.js';
import Message from '../models/Message.js';

const router = express.Router();

// Só admin/moderador podem criar/excluir canais
const requireAdmin = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'moderador')) {
    return next();
  }
  res.status(403).json({ error: 'Acesso negado: requer admin ou moderador.' });
};

// Transforma um texto em slug: "Rainbow Six" -> "rainbow-six"
function gerarSlug(texto) {
  return texto
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // remove acentos
    .replace(/[^a-z0-9]+/g, '-')                      // não-alfanumérico vira -
    .replace(/^-+|-+$/g, '');                         // tira - das pontas
}

// GET /canais - lista todos os canais (público)
router.get('/', async (req, res) => {
  try {
    const canais = await Canal.find().sort({ criadoEm: 1 });
    res.json(canais);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /canais - cria um canal (admin/mod)
router.post('/', passport.authenticate('jwt', { session: false }), requireAdmin, async (req, res) => {
  try {
    const { label } = req.body;
    if (!label || !label.trim()) {
      return res.status(400).json({ error: 'Informe o nome do canal.' });
    }

    const nome = gerarSlug(label);
    if (!nome) {
      return res.status(400).json({ error: 'Nome de canal inválido.' });
    }

    const existe = await Canal.findOne({ nome });
    if (existe) {
      return res.status(400).json({ error: 'Já existe um canal com esse nome.' });
    }

    const canal = await Canal.create({ nome, label: label.trim() });
    res.status(201).json(canal);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /canais/:nome - exclui um canal e suas mensagens (admin/mod)
router.delete('/:nome', passport.authenticate('jwt', { session: false }), requireAdmin, async (req, res) => {
  try {
    const { nome } = req.params;

    // O canal 'geral' é o padrão da plataforma e não pode ser removido
    if (nome === 'geral') {
      return res.status(400).json({ error: 'O canal "geral" não pode ser excluído.' });
    }

    const canal = await Canal.findOneAndDelete({ nome });
    if (!canal) return res.status(404).json({ error: 'Canal não encontrado.' });

    // Remove também todas as mensagens do canal excluído
    await Message.deleteMany({ canal: nome });

    res.json({ message: 'Canal removido com sucesso.', nome });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
