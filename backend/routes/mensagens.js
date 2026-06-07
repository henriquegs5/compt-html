import express from 'express';
import passport from 'passport';
import Message from '../models/Message.js';

const router = express.Router();

// GET /mensagens?canal=xyz&page=1
router.get('/', async (req, res) => {
  try {
    const canal = req.query.canal || 'geral';
    const page = parseInt(req.query.page) || 1;
    const limit = 50;
    const skip = (page - 1) * limit;

    // Busca as últimas mensagens ordenadas pela data decrescente para a paginação
    const mensagens = await Message.find({ canal })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Como as mensagens vêm do banco da mais recente para a mais antiga (decrescente),
    // precisamos inverter a ordem para exibir na tela (a mais antiga no topo).
    const mensagensEmOrdem = mensagens.reverse();

    res.json(mensagensEmOrdem);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /mensagens
router.post('/', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const { canal, text } = req.body;
    
    const novaMensagem = new Message({
      canal,
      text,
      authorUid: req.user.id,
      authorName: req.user.name
    });

    const mensagemSalva = await novaMensagem.save();
    res.status(201).json(mensagemSalva);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
