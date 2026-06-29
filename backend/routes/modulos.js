import express from 'express';
import passport from 'passport';
import Modulo from '../models/Modulo.js';
import Progresso from '../models/Progresso.js';
import Curso from '../models/Curso.js';
import Matricula from '../models/Matricula.js';

const router = express.Router();

// Middleware para verificar se é admin/moderador
const requireAdmin = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'moderador')) {
    next();
  } else {
    res.status(403).json({ error: 'Acesso negado: Requer privilégios de administrador.' });
  }
};

// GET /modulos/meus-progressos - Busca todos os progressos (de todos os cursos) do usuário
router.get('/meus-progressos', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const progressos = await Progresso.find({ userId: req.user.id });
    
    // Auto-cura do banco: verificar se os cursos desses progressos ainda existem
    const cursosExistentes = await Curso.find({ _id: { $in: progressos.map(p => p.cursoId) } }).select('_id');
    const idsCursosExistentes = cursosExistentes.map(c => c._id.toString());
    
    const progressosValidos = progressos.filter(p => idsCursosExistentes.includes(p.cursoId));
    
    // Remove os progressos cujos cursos foram apagados antes da implementação da exclusão em cascata
    const orfaos = progressos.filter(p => !idsCursosExistentes.includes(p.cursoId));
    if (orfaos.length > 0) {
      await Progresso.deleteMany({ _id: { $in: orfaos.map(o => o._id) } });
    }

    res.json(progressosValidos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /modulos - Lista todos os módulos autorizados para o usuário
router.get('/', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const isAdMod = req.user.role === 'admin' || req.user.role === 'moderador';

    if (isAdMod) {
      // Admins e moderadores podem ver todos os módulos
      const modulos = await Modulo.find();
      return res.json(modulos);
    }

    // Para usuários normais:
    // 1. Descobrir quais cursos são gratuitos
    const cursosGratis = await Curso.find({ pago: { $ne: true } }).select('_id');
    const gratisIds = cursosGratis.map(c => c._id.toString());

    // 2. Descobrir em quais cursos pagos o usuário está matriculado
    const matriculas = await Matricula.find({ userId: req.user.id }).select('cursoId');
    const matriculadosIds = matriculas.map(m => m.cursoId);

    // Lista consolidada de cursos permitidos
    const cursosPermitidos = [...new Set([...gratisIds, ...matriculadosIds])];

    // Buscar módulos apenas desses cursos
    const modulos = await Modulo.find({ cursoId: { $in: cursosPermitidos } });
    res.json(modulos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /modulos/:id - Retorna um módulo específico (com verificação de acesso)
router.get('/:id', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const modulo = await Modulo.findById(req.params.id);
    if (!modulo) return res.status(404).json({ error: 'Módulo não encontrado' });

    // Verificação de acesso para o módulo específico
    const curso = await Curso.findById(modulo.cursoId);
    if (curso && curso.pago) {
      const isAdMod = req.user.role === 'admin' || req.user.role === 'moderador';
      const matriculado = await Matricula.findOne({ userId: req.user.id, cursoId: curso._id.toString() });

      if (!isAdMod && !matriculado) {
        return res.status(403).json({ error: 'Acesso negado: Você não possui matrícula neste curso pago.' });
      }
    }

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
    
    // Apaga os progressos vinculados a este módulo
    await Progresso.deleteMany({ moduloId: req.params.id });
    
    res.json({ message: 'Módulo removido com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /modulos/curso/:cursoId/progresso - Busca todo o progresso do usuário no curso
router.get('/curso/:cursoId/progresso', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const progressos = await Progresso.find({
      userId: req.user.id,
      cursoId: req.params.cursoId
    });
    res.json(progressos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /modulos/:id/progresso - Atualiza ou cria o progresso do usuário em um módulo
router.post('/:id/progresso', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const { status, cursoId } = req.body;
    
    // UPSERT: se existir, atualiza. Se não existir, cria.
    const progresso = await Progresso.findOneAndUpdate(
      { userId: req.user.id, moduloId: req.params.id },
      { 
        status, 
        cursoId,
        atualizadoEm: Date.now() 
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    
    res.json(progresso);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
