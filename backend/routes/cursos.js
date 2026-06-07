import express from 'express';
import passport from 'passport';
import Curso from '../models/Curso.js';
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

// GET /cursos - Lista todos os cursos
router.get('/', async (req, res) => {
  try {
    const cursos = await Curso.find().lean();
    // Computa dinamicamente a quantidade de módulos de cada curso
    const cursosComModulos = await Promise.all(cursos.map(async (curso) => {
      const count = await Modulo.countDocuments({ cursoId: curso._id });
      return { ...curso, totalModulos: count, id: curso._id.toString() };
    }));
    
    res.json(cursosComModulos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /cursos/:id - Retorna um curso específico (Protegido)
router.get('/:id', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const curso = await Curso.findById(req.params.id);
    if (!curso) return res.status(404).json({ error: 'Curso não encontrado' });
    res.json(curso);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /cursos - Cria um novo curso
router.post('/', passport.authenticate('jwt', { session: false }), requireAdmin, async (req, res) => {
  try {
    const novoCurso = new Curso(req.body);
    const cursoSalvo = await novoCurso.save();
    res.status(201).json(cursoSalvo);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PATCH /cursos/:id - Atualiza parcialmente um curso
router.patch('/:id', passport.authenticate('jwt', { session: false }), requireAdmin, async (req, res) => {
  try {
    const cursoAtualizado = await Curso.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!cursoAtualizado) return res.status(404).json({ error: 'Curso não encontrado' });
    res.json(cursoAtualizado);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /cursos/:id - Remove um curso
router.delete('/:id', passport.authenticate('jwt', { session: false }), requireAdmin, async (req, res) => {
  try {
    const cursoDeletado = await Curso.findByIdAndDelete(req.params.id);
    if (!cursoDeletado) return res.status(404).json({ error: 'Curso não encontrado' });
    res.json({ message: 'Curso removido com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
