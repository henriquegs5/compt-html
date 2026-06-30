import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { fetchCanais, criarCanal, excluirCanal, setCanal } from '../store/chatSlice'
import { fetchAtualizacoes, criarAtualizacao, editarAtualizacao, excluirAtualizacao } from '../store/atualizacoesSlice'
import Layout from '../components/Layout'
import Chat from '../components/Chat'
import './Comunidade.css'

function formatDateTime(dateString) {
  if (!dateString) return ''
  const d = new Date(dateString)
  return d.toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

export default function Comunidade() {
  const dispatch = useDispatch()
  const canais = useSelector(s => s.chat.canais)
  const canalAtivo = useSelector(s => s.chat.canalAtivo)
  const usuario = useSelector(s => s.auth.usuario)
  const { lista: atualizacoes, status: atualizacoesStatus } = useSelector(s => s.atualizacoes)

  const podeGerenciar = usuario?.role === 'admin' || usuario?.role === 'moderador'

  const [aba, setAba] = useState('atualizacoes')

  // Estado do formulário de criar/editar atualização
  const [formTitle, setFormTitle] = useState('')
  const [formText, setFormText] = useState('')
  const [editandoId, setEditandoId] = useState(null)
  const [mostrarForm, setMostrarForm] = useState(false)

  useEffect(() => {
    dispatch(fetchCanais())
    dispatch(fetchAtualizacoes())
  }, [dispatch])

  function handleCanal(canal) {
    dispatch(setCanal(canal))
    setAba('canal')
  }

  function handleAbaAtualizacoes() {
    setAba('atualizacoes')
  }

  function extrairErro(err) {
    return err?.message || (typeof err === 'string' ? err : 'Erro desconhecido')
  }

  async function handleCriarCanal() {
    const label = window.prompt('Nome do novo canal:')
    if (!label || !label.trim()) return
    try {
      await dispatch(criarCanal(label.trim())).unwrap()
    } catch (err) {
      alert(`Não foi possível criar o canal: ${extrairErro(err)}`)
    }
  }

  async function handleExcluirCanal(e, nome) {
    e.stopPropagation()
    if (!window.confirm(`Excluir o canal "${nome}" e todas as suas mensagens?`)) return
    try {
      await dispatch(excluirCanal(nome)).unwrap()
    } catch (err) {
      alert(`Não foi possível excluir o canal: ${extrairErro(err)}`)
    }
  }

  function iniciarCriacao() {
    setEditandoId(null)
    setFormTitle('')
    setFormText('')
    setMostrarForm(true)
  }

  function iniciarEdicao(update) {
    setEditandoId(update.id)
    setFormTitle(update.title)
    setFormText(update.text)
    setMostrarForm(true)
  }

  function cancelarForm() {
    setMostrarForm(false)
    setEditandoId(null)
    setFormTitle('')
    setFormText('')
  }

  async function handleSalvarAtualizacao() {
    if (!formTitle.trim() || !formText.trim()) return
    try {
      if (editandoId) {
        await dispatch(editarAtualizacao({ id: editandoId, title: formTitle.trim(), text: formText.trim() })).unwrap()
      } else {
        await dispatch(criarAtualizacao({ title: formTitle.trim(), text: formText.trim() })).unwrap()
      }
      cancelarForm()
    } catch (err) {
      alert(`Erro: ${extrairErro(err)}`)
    }
  }

  async function handleExcluirAtualizacao(id) {
    if (!window.confirm('Excluir esta atualização?')) return
    try {
      await dispatch(excluirAtualizacao(id)).unwrap()
    } catch (err) {
      alert(`Erro: ${extrairErro(err)}`)
    }
  }

  return (
    <Layout>
      <h1 className="title">Comunidade</h1>

      <div className="chat-tabs">
        <button
          className={`tab${aba === 'atualizacoes' ? ' active' : ''}`}
          onClick={handleAbaAtualizacoes}
        >
          📢 Atualizações
        </button>

        {canais.map(c => (
          <button
            key={c.nome}
            className={`tab${aba === 'canal' && canalAtivo === c.nome ? ' active' : ''}`}
            onClick={() => handleCanal(c.nome)}
          >
            {c.label}
            {podeGerenciar && c.nome !== 'geral' && (
              <span
                className="tab-excluir"
                title="Excluir canal"
                onClick={(e) => handleExcluirCanal(e, c.nome)}
              >
                ✕
              </span>
            )}
          </button>
        ))}

        {podeGerenciar && (
          <button className="tab tab-novo" onClick={handleCriarCanal} title="Criar canal">
            + Novo canal
          </button>
        )}
      </div>

      {aba === 'atualizacoes' ? (
        <div className="atualizacoes-section">
          {podeGerenciar && !mostrarForm && (
            <button className="btn-criar-atualizacao" onClick={iniciarCriacao}>
              + Nova atualização
            </button>
          )}

          {podeGerenciar && mostrarForm && (
            <div className="atualizacoes-form">
              <input
                type="text"
                className="atualizacao-input-title"
                placeholder="Título da atualização"
                value={formTitle}
                onChange={e => setFormTitle(e.target.value)}
              />
              <textarea
                className="atualizacao-input-text"
                placeholder="Escreva a atualização..."
                rows={4}
                value={formText}
                onChange={e => setFormText(e.target.value)}
              />
              <div className="atualizacao-form-actions">
                <button className="btn-cancelar" onClick={cancelarForm}>Cancelar</button>
                <button className="btn-salvar" onClick={handleSalvarAtualizacao}>
                  {editandoId ? 'Salvar alterações' : 'Publicar'}
                </button>
              </div>
            </div>
          )}

          {atualizacoesStatus === 'loading' && <p className="chat-empty">Carregando...</p>}

          {atualizacoesStatus === 'succeeded' && atualizacoes.length === 0 && (
            <p className="chat-empty">Nenhuma atualização ainda.</p>
          )}

          <div className="atualizacoes-lista">
            {atualizacoes.map(up => (
              <div key={up.id} className="atualizacao-card">
                <div className="atualizacao-header">
                  <h3 className="atualizacao-titulo">{up.title}</h3>
                  {podeGerenciar && (
                    <div className="atualizacao-actions">
                      <button className="msg-action-btn" title="Editar" onClick={() => iniciarEdicao(up)}>✏️</button>
                      <button className="msg-action-btn msg-delete-btn" title="Excluir" onClick={() => handleExcluirAtualizacao(up.id)}>🗑️</button>
                    </div>
                  )}
                </div>
                <p className="atualizacao-texto">{up.text}</p>
                <div className="atualizacao-meta">
                  <Link to={`/perfil/${up.authorUid}`} className="atualizacao-autor">{up.authorName}</Link>
                  <span className="atualizacao-data">{formatDateTime(up.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        canalAtivo && <Chat canal={canalAtivo} />
      )}
    </Layout>
  )
}
