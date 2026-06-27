import express from 'express';
import passport from 'passport';
import Progresso from '../models/Progresso.js';

const router = express.Router();

// Todas as rotas deste arquivo exigem JWT. Além disso, o controle de
// acesso aos DADOS é garantido usando sempre req.user.id: o usuário só
// enxerga e altera o próprio progresso, nunca o de outra pessoa.
const auth = passport.authenticate('jwt', { session: false });

// GET /progressos
// Retorna apenas os progressos do usuário logado, no formato de um mapa
// { moduloId: status } — fácil de consumir no frontend para sobrepor
// o status nos módulos.
router.get('/', auth, async (req, res) => {
  try {
    const registros = await Progresso.find({ userId: req.user.id }).lean();
    const mapa = {};
    for (const r of registros) {
      mapa[r.moduloId] = r.status;
    }
    res.json(mapa);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /progressos/:moduloId
// Cria ou atualiza (upsert) o progresso do usuário logado naquele módulo.
// Como filtramos por { userId: req.user.id }, um usuário nunca consegue
// gravar progresso em nome de outro.
router.put('/:moduloId', auth, async (req, res) => {
  try {
    const { status } = req.body;

    // Valida o status recebido antes de gravar
    const statusValidos = ['locked', 'in-progress', 'completed'];
    if (!statusValidos.includes(status)) {
      return res.status(400).json({ error: 'Status inválido.' });
    }

    const progresso = await Progresso.findOneAndUpdate(
      { userId: req.user.id, moduloId: req.params.moduloId },
      { $set: { status } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.json({ moduloId: req.params.moduloId, status: progresso.status });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
