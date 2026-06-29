import express from 'express';
import passport from 'passport';
import Curso from '../models/Curso.js';
import Modulo from '../models/Modulo.js';
import Review from '../models/Review.js';
import Matricula from '../models/Matricula.js';
import Progresso from '../models/Progresso.js';

const router = express.Router();

// Helper para autenticação opcional
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return next();
  passport.authenticate('jwt', { session: false }, (err, user) => {
    if (user) req.user = user;
    next();
  })(req, res, next);
};

// Middleware para verificar se é admin/moderador
const requireAdmin = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'moderador')) {
    next();
  } else {
    res.status(403).json({ error: 'Acesso negado: Requer privilégios de administrador.' });
  }
};

// GET /cursos - Lista todos os cursos
router.get('/', optionalAuth, async (req, res) => {
  try {
    const isAdminOrMod = req.user && (req.user.role === 'admin' || req.user.role === 'moderador');
    let cursos = await Curso.find().lean();
    
    // Computa dinamicamente a quantidade de módulos e avaliações de cada curso
    let cursosEnriquecidos = await Promise.all(cursos.map(async (curso) => {
      const totalModulos = await Modulo.countDocuments({ cursoId: curso._id });
      
      const reviews = await Review.find({ cursoId: curso._id });
      const totalAvaliacoes = reviews.length;
      const mediaAvaliacoes = totalAvaliacoes > 0 
        ? reviews.reduce((acc, curr) => acc + curr.nota, 0) / totalAvaliacoes 
        : 0;

      const cursoEnriquecido = { 
        ...curso, 
        totalModulos, 
        totalAvaliacoes,
        mediaAvaliacoes,
        id: curso._id.toString() 
      };

      if (isAdminOrMod && totalModulos === 0) {
        cursoEnriquecido.rascunho = true;
      }

      return cursoEnriquecido;
    }));
    
    // Filtra cursos vazios se o usuário não for admin/moderador
    if (!isAdminOrMod) {
      cursosEnriquecidos = cursosEnriquecidos.filter(c => c.totalModulos > 0);
    }
    
    res.json(cursosEnriquecidos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /cursos/matriculados - Lista IDs dos cursos em que o usuário está matriculado
router.get('/matriculados', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const matriculas = await Matricula.find({ userId: req.user.id });
    const cursoIds = matriculas.map(m => m.cursoId);
    res.json(cursoIds);
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
    const dadosCurso = {
      ...req.body,
      criadorId: req.user.id
    };
    const novoCurso = new Curso(dadosCurso);
    const cursoSalvo = await novoCurso.save();
    res.status(201).json(cursoSalvo);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PATCH /cursos/:id - Atualiza parcialmente um curso
router.patch('/:id', passport.authenticate('jwt', { session: false }), requireAdmin, async (req, res) => {
  try {
    const cursoAtual = await Curso.findById(req.params.id);
    if (!cursoAtual) return res.status(404).json({ error: 'Curso não encontrado' });
    
    // Admin pode editar qualquer curso. Os demais (ex: moderador) só podem
    // editar cursos que criaram, ou cursos sem criador (retrocompatibilidade).
    if (req.user.role !== 'admin' && cursoAtual.criadorId && cursoAtual.criadorId !== req.user.id) {
      return res.status(403).json({ error: 'Acesso negado: Apenas o criador do curso pode modificá-lo.' });
    }

    const cursoAtualizado = await Curso.findByIdAndUpdate(
      req.params.id,
      req.body,
      { returnDocument: 'after', runValidators: true }
    );
    res.json(cursoAtualizado);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /cursos/:id - Remove um curso
router.delete('/:id', passport.authenticate('jwt', { session: false }), requireAdmin, async (req, res) => {
  try {
    const cursoAtual = await Curso.findById(req.params.id);
    if (!cursoAtual) return res.status(404).json({ error: 'Curso não encontrado' });

    // Admin pode excluir qualquer curso; os demais só os que criaram (ou sem criador).
    if (req.user.role !== 'admin' && cursoAtual.criadorId && cursoAtual.criadorId !== req.user.id) {
      return res.status(403).json({ error: 'Acesso negado: Apenas o criador do curso pode excluí-lo.' });
    }

    // Exclusão em cascata: limpa todos os dados que dependem deste curso
    await Modulo.deleteMany({ cursoId: req.params.id });
    await Review.deleteMany({ cursoId: req.params.id });
    await Matricula.deleteMany({ cursoId: req.params.id });
    await Progresso.deleteMany({ cursoId: req.params.id });

    await Curso.findByIdAndDelete(req.params.id);
    res.json({ message: 'Curso e todos os dados associados removidos com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /cursos/:id/matricula - Realiza matrícula no curso
router.post('/:id/matricula', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const matricula = new Matricula({
      cursoId: req.params.id,
      userId: req.user.id
    });
    const matriculaSalva = await matricula.save();
    res.status(201).json(matriculaSalva);
  } catch (error) {
    if (error.code === 11000) { // Erro de duplicação
      return res.status(200).json({ message: 'Já matriculado' });
    }
    res.status(400).json({ error: error.message });
  }
});

// DELETE /cursos/:id/matricula - Cancela matrícula no curso
router.delete('/:id/matricula', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    await Matricula.findOneAndDelete({
      cursoId: req.params.id,
      userId: req.user.id
    });
    res.json({ message: 'Matrícula cancelada com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /cursos/:id/reviews - Lista avaliações de um curso
router.get('/:id/reviews', async (req, res) => {
  try {
    const reviews = await Review.find({ cursoId: req.params.id }).sort({ criadoEm: -1 });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /cursos/:id/reviews - Adiciona ou atualiza avaliação
router.post('/:id/reviews', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const { nota, texto } = req.body;
    if (nota === undefined || nota < 0 || nota > 5) {
      return res.status(400).json({ error: 'Nota inválida. Deve estar entre 0 e 5.' });
    }

    const review = await Review.findOneAndUpdate(
      { cursoId: req.params.id, userId: req.user.id },
      { 
        nota, 
        texto: texto || '', 
        userName: req.user.name 
      },
      { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true }
    );
    
    res.json(review);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
