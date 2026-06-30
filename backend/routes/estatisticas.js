import express from 'express';
import passport from 'passport';
import UserCursoStat from '../models/UserCursoStat.js';
import Curso from '../models/Curso.js';
import Matricula from '../models/Matricula.js';

const router = express.Router();

// GET /estatisticas - Retorna as estatísticas do usuário logado em todos os
// cursos em que está matriculado, combinadas com os rankingMethods do curso.
router.get('/', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const matriculas = await Matricula.find({ userId: req.user.id }).lean();
    const cursoIds = matriculas.map(m => m.cursoId);

    const cursos = await Curso.find({ _id: { $in: cursoIds } }).lean();

    const userStats = await UserCursoStat.find({ userId: req.user.id }).lean();

    const statsMap = {};
    userStats.forEach(stat => { statsMap[stat.cursoId] = stat.stats; });

    const result = cursos.map(curso => ({
      cursoId: curso._id.toString(),
      titulo: curso.titulo,
      imagem: curso.imagem,
      rankingMethods: curso.rankingMethods || [],
      stats: statsMap[curso._id.toString()] || [],
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /estatisticas/user/:userId - Retorna as estatísticas PÚBLICAS de um usuário específico
router.get('/user/:userId', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const cursos = await Curso.find().lean();

    const userStats = await UserCursoStat.find({ userId: req.params.userId }).lean();

    const statsMap = {};
    userStats.forEach(stat => {
      const statsPublicas = stat.stats.filter(s => s.publico);
      if (statsPublicas.length > 0) statsMap[stat.cursoId] = statsPublicas;
    });

    const result = cursos
      .filter(curso => statsMap[curso._id.toString()])
      .map(curso => ({
        cursoId: curso._id.toString(),
        titulo: curso.titulo,
        imagem: curso.imagem,
        rankingMethods: curso.rankingMethods || [],
        stats: statsMap[curso._id.toString()] || [],
      }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /estatisticas - Salva as estatísticas do usuário para um curso
router.put('/', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const { cursoId, stats } = req.body;

    // Upsert: cria se não existir, atualiza se existir
    const atualizado = await UserCursoStat.findOneAndUpdate(
      { userId: req.user.id, cursoId },
      { $set: { stats } },
      { returnDocument: 'after', upsert: true }
    );

    res.json(atualizado);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
