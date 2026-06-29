import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { fetchCursos, matricularCurso, selectAllCursos } from '../store/cursosSlice'
import Layout from '../components/Layout'
import Toast from '../components/Toast'
import { srcImagemCurso } from '../utils/imagemCurso'
import './Pagamento.css'

export default function Pagamento() {
  const { cursoId } = useParams()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  
  const cursos = useSelector(selectAllCursos)
  const status = useSelector(s => s.cursos.status)
  
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(null)
  const [formData, setFormData] = useState({
    nome: '',
    numero: '',
    validade: '',
    cvv: ''
  })

  useEffect(() => {
    if (status === 'idle') dispatch(fetchCursos())
  }, [dispatch, status])

  const curso = cursos.find(c => c.id === cursoId)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setLoading(true)
    
    // Simula delay de pagamento
    setTimeout(() => {
      dispatch(matricularCurso(cursoId))
        .unwrap()
        .then(() => {
          setLoading(false)
          setToast('Pagamento confirmado! Redirecionando...')
          setTimeout(() => navigate(`/cursos/${cursoId}`), 2000)
        })
        .catch(err => {
          setLoading(false)
          setToast(`Erro: ${err}`)
        })
    }, 1500)
  }

  if (status === 'loading') {
    return <Layout><p className="loading-msg">Carregando...</p></Layout>
  }

  if (!curso) {
    return <Layout><p className="loading-msg">Curso não encontrado.</p></Layout>
  }

  return (
    <Layout>
      <div className="pagamento-container">
        <button className="btn-voltar-pgto" onClick={() => navigate('/')}>
          ← Voltar
        </button>
        
        <div className="pagamento-content">
          <div className="pagamento-info">
            <h2>Resumo do Pedido</h2>
            <div className="pgto-curso-card">
              <img src={srcImagemCurso(curso.imagem)} alt={curso.titulo} />
              <div>
                <h3>{curso.titulo}</h3>
                <p className="pgto-price">R$ {curso.preco.toFixed(2)}</p>
              </div>
            </div>
            <div className="pgto-benefits">
              <p>✓ Acesso vitalício ao curso</p>
              <p>✓ Atualizações gratuitas</p>
              <p>✓ Certificado de conclusão</p>
            </div>
          </div>

          <div className="pagamento-form-wrapper">
            <h2>Dados do Pagamento</h2>
            
            <div className="credit-card-preview">
              <div className="cc-chip"></div>
              <div className="cc-number">
                {formData.numero || '•••• •••• •••• ••••'}
              </div>
              <div className="cc-details">
                <div className="cc-name">{formData.nome || 'NOME NO CARTÃO'}</div>
                <div className="cc-val">{formData.validade || 'MM/AA'}</div>
              </div>
            </div>

            <form className="pagamento-form" onSubmit={handleSubmit}>
              <label>
                Nome impresso no cartão
                <input 
                  type="text" 
                  name="nome"
                  required 
                  value={formData.nome}
                  onChange={handleChange}
                  placeholder="JOAO M SILVA"
                />
              </label>
              
              <label>
                Número do cartão
                <input 
                  type="text" 
                  name="numero"
                  required 
                  maxLength="19"
                  value={formData.numero}
                  onChange={handleChange}
                  placeholder="0000 0000 0000 0000"
                />
              </label>

              <div className="form-row-pgto">
                <label>
                  Validade
                  <input 
                    type="text" 
                    name="validade"
                    required 
                    maxLength="5"
                    value={formData.validade}
                    onChange={handleChange}
                    placeholder="MM/AA"
                  />
                </label>
                <label>
                  CVV
                  <input 
                    type="text" 
                    name="cvv"
                    required 
                    maxLength="4"
                    value={formData.cvv}
                    onChange={handleChange}
                    placeholder="123"
                  />
                </label>
              </div>

              <button 
                type="submit" 
                className="btn-confirmar-pgto"
                disabled={loading}
              >
                {loading ? 'Processando...' : `Pagar R$ ${curso.preco.toFixed(2)}`}
              </button>
            </form>
          </div>
        </div>
      </div>
      
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </Layout>
  )
}
