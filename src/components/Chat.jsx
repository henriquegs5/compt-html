// ============================================================
// components/Chat.jsx
// Chat reutilizável de um canal. Mostra a caixa de mensagens (com
// paginação ao rolar para o topo) e o campo de envio.
//
// Recebe o canal por prop, então o mesmo componente serve tanto para a
// página Comunidade quanto para o chat dentro do modal de um módulo.
// ============================================================

import React, { useEffect, useState, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { fetchMensagens, postMensagem, deleteMensagem, editarMensagem } from '../store/chatSlice'
import '../pages/Comunidade.css'

function formatTime(dateString) {
  if (!dateString) return ''
  const d = new Date(dateString)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function formatDateHeader(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  const now = new Date()

  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()

  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()

  if (isToday) return 'Hoje'
  if (isYesterday) return 'Ontem'

  const formatter = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })
  return formatter.format(date)
}

export default function Chat({ canal }) {
  const dispatch = useDispatch()
  const { mensagens, status, page, hasMore } = useSelector(s => s.chat)
  const usuario = useSelector(s => s.auth.usuario)
  const [texto, setTexto] = useState('')
  const chatBoxRef = useRef(null)

  // Estado para edição
  const [editingMsgId, setEditingMsgId] = useState(null)
  const [editingText, setEditingText] = useState('')

  // Ao montar ou trocar de canal, busca a primeira página de mensagens
  useEffect(() => {
    if (canal) dispatch(fetchMensagens({ canal, page: 1 }))
  }, [dispatch, canal])

  // mensagens[canal] pode não existir até a primeira busca — || [] evita erro
  const msgs = mensagens[canal] || []

  // Rolar para baixo ao carregar a primeira página ou ao enviar nova msg
  useEffect(() => {
    if (chatBoxRef.current) {
      if (page[canal] === 1 || page[canal] === undefined) {
        chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight
      }
    }
  }, [msgs, canal, page])

  function handleScroll(e) {
    // Rolou até o topo → carrega mensagens mais antigas (próxima página)
    if (e.target.scrollTop === 0 && hasMore[canal] && status !== 'loading') {
      dispatch(fetchMensagens({ canal, page: (page[canal] || 1) + 1 }))
    }
  }

  function enviar() {
    const text = texto.trim()
    if (!text) return
    dispatch(postMensagem({ canal, text }))
    setTexto('')
  }

  function handleExcluir(msg) {
    if (window.confirm('Tem certeza que deseja excluir esta mensagem?')) {
      dispatch(deleteMensagem({ id: msg.id, canal }))
    }
  }

  function iniciarEdicao(msg) {
    setEditingMsgId(msg.id)
    setEditingText(msg.text)
  }

  function cancelarEdicao() {
    setEditingMsgId(null)
    setEditingText('')
  }

  function salvarEdicao(msg) {
    const text = editingText.trim()
    if (!text) return
    if (text !== msg.text) {
      dispatch(editarMensagem({ id: msg.id, canal, text }))
    }
    cancelarEdicao()
  }

  let lastDateHeader = null

  const isAdminMod = usuario?.role === 'admin' || usuario?.role === 'moderador'

  return (
    <>
      <div className="chat-box" ref={chatBoxRef} onScroll={handleScroll}>
        {status === 'loading' && <p className="chat-empty">Carregando mensagens antigas...</p>}
        {status !== 'loading' && msgs.length === 0 && (
          <p className="chat-empty">Nenhuma mensagem ainda. Seja o primeiro!</p>
        )}
        {msgs.map((msg, i) => {
          const isOwn = msg.authorName === usuario?.name
          const podeExcluir = isOwn || isAdminMod
          const podeEditar = isOwn
          
          const dateHeader = formatDateHeader(msg.createdAt)
          const showHeader = dateHeader !== lastDateHeader
          if (showHeader) {
            lastDateHeader = dateHeader
          }

          return (
            <React.Fragment key={msg.id || i}>
              {showHeader && <div className="chat-date-separator">{dateHeader}</div>}
              <div className={`message${isOwn ? ' message--own' : ''}`}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Link to={`/perfil/${msg.authorUid}`} className="msg-user">{msg.authorName}</Link>
                  <div className="msg-actions" style={{ display: 'flex', gap: '8px' }}>
                    {podeEditar && editingMsgId !== msg.id && (
                      <button className="msg-action-btn" title="Editar" onClick={() => iniciarEdicao(msg)}>✏️</button>
                    )}
                    {podeExcluir && (
                      <button className="msg-action-btn msg-delete-btn" title="Excluir" onClick={() => handleExcluir(msg)}>🗑️</button>
                    )}
                  </div>
                </div>

                {editingMsgId === msg.id ? (
                  <div className="msg-edit-container" style={{ marginTop: '5px' }}>
                    <input 
                      type="text" 
                      value={editingText} 
                      onChange={e => setEditingText(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && salvarEdicao(msg)}
                      style={{ width: '100%', padding: '5px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
                    />
                    <div style={{ display: 'flex', gap: '5px', marginTop: '5px', justifyContent: 'flex-end' }}>
                      <button onClick={cancelarEdicao} style={{ padding: '2px 8px', fontSize: '0.8rem', borderRadius: '4px', cursor: 'pointer', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)' }}>Cancelar</button>
                      <button onClick={() => salvarEdicao(msg)} style={{ padding: '2px 8px', fontSize: '0.8rem', borderRadius: '4px', cursor: 'pointer', border: 'none', background: 'var(--primary)', color: '#fff' }}>Salvar</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <span className="msg-text">{msg.text}</span>
                    <span className="msg-time">{formatTime(msg.createdAt)}</span>
                  </>
                )}
              </div>
            </React.Fragment>
          )
        })}
      </div>

      <div className="chat-input">
        <input
          type="text"
          value={texto}
          onChange={e => setTexto(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && enviar()}
          placeholder="Digite sua mensagem..."
        />
        <button onClick={enviar}>Enviar</button>
      </div>
    </>
  )
}
