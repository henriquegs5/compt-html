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

// PUT /mensagens/:id - Edita uma mensagem existente
router.put('/:id', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    const mensagem = await Message.findById(id);
    if (!mensagem) {
      return res.status(404).json({ error: 'Mensagem não encontrada.' });
    }

    // Apenas o autor pode editar
    if (mensagem.authorUid !== req.user.id) {
      return res.status(403).json({ error: 'Você só pode editar suas próprias mensagens.' });
    }

    mensagem.text = text;
    // Opcional: registrar que foi editada, se o schema permitisse.
    const mensagemAtualizada = await mensagem.save();
    res.json(mensagemAtualizada);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /mensagens/:id - Exclui uma mensagem
router.delete('/:id', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const { id } = req.params;

    const mensagem = await Message.findById(id);
    if (!mensagem) {
      return res.status(404).json({ error: 'Mensagem não encontrada.' });
    }

    // Pode excluir se for o autor OU admin/moderador
    const isAutor = mensagem.authorUid === req.user.id;
    const isAdminMod = req.user.role === 'admin' || req.user.role === 'moderador';

    if (!isAutor && !isAdminMod) {
      return res.status(403).json({ error: 'Sem permissão para excluir esta mensagem.' });
    }

    await Message.findByIdAndDelete(id);
    res.json({ message: 'Mensagem excluída com sucesso.', id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
