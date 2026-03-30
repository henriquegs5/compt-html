import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchModulos, setModuloStatus } from '../store/modulosSlice'
import Layout from '../components/Layout'
import Modal from '../components/Modal'
import Toast from '../components/Toast'
import './Modulos.css'

export default function Modulos() {
  const dispatch = useDispatch()
  const { items, status } = useSelector(s => s.modulos)

  const [modalModulo, setModalModulo] = useState(null)
  const [toast, setToast]             = useState(null)

  useEffect(() => {
    if (status === 'idle') dispatch(fetchModulos())
  }, [dispatch, status])

  function handleAcao(modulo, novoStatus) {
    dispatch(setModuloStatus({ id: modulo.id, status: novoStatus }))
    setModalModulo(null)
    setToast(novoStatus === 'completed' ? '🎉 Módulo concluído!' : '▶ Módulo iniciado!')
  }

  return (
    <Layout>
      <h1 className="title">Módulos do Curso</h1>

      {status === 'loading' && <p className="loading-msg">Carregando módulos...</p>}

      <div className="module-grid">
        {items.map(mod => (
          <div className="module-card" key={mod.id} onClick={() => setModalModulo(mod)}>
            <div className="module-image">
              <img src={`/img/${mod.imagem}`} alt={mod.titulo} onError={e => e.target.style.display='none'} />
            </div>
            <h3>{mod.titulo}</h3>
            <p>{mod.descricao}</p>
            {mod.status !== 'locked' && (
              <span className={`module-badge module-badge--${mod.status}`}>
                {mod.status === 'completed' ? '✓ Concluído' : '▶ Em andamento'}
              </span>
            )}
          </div>
        ))}
      </div>

      {modalModulo && (
        <Modal onClose={() => setModalModulo(null)}>
          <div className="compt-modal-header">
            <h3>{modalModulo.titulo}</h3>
            <span className={`modal-status-label modal-status--${modalModulo.status}`}>
              {modalModulo.status === 'locked' ? 'Não iniciado'
                : modalModulo.status === 'in-progress' ? 'Em andamento'
                : 'Concluído'}
            </span>
          </div>
          <p className="compt-modal-sub">Gerencie seu progresso neste módulo.</p>
          <div className="compt-modal-actions">
            {modalModulo.status === 'locked' && (
              <button className="btn-primary" onClick={() => handleAcao(modalModulo, 'in-progress')}>
                ▶ Iniciar módulo
              </button>
            )}
            {modalModulo.status === 'in-progress' && (
              <button className="btn-primary" onClick={() => handleAcao(modalModulo, 'completed')}>
                ✓ Marcar como concluído
              </button>
            )}
            {modalModulo.status === 'completed' && (
              <p className="mod-done-msg">✓ Módulo já concluído!</p>
            )}
            <button className="btn-secondary" onClick={() => setModalModulo(null)}>Fechar</button>
          </div>
        </Modal>
      )}

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </Layout>
  )
}
