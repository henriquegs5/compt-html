// ============================================================
// components/Chat.jsx
// Chat reutilizável de um canal. Mostra a caixa de mensagens (com
// paginação ao rolar para o topo) e o campo de envio.
//
// Recebe o canal por prop, então o mesmo componente serve tanto para a
// página Comunidade quanto para o chat dentro do modal de um módulo.
// ============================================================

import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchMensagens, postMensagem } from '../store/chatSlice'
// Reaproveita os estilos do chat já definidos na página Comunidade
import '../pages/Comunidade.css'

function formatTime(dateString) {
  if (!dateString) return ''
  const d = new Date(dateString)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export default function Chat({ canal }) {
  const dispatch = useDispatch()
  const { mensagens, status, page, hasMore } = useSelector(s => s.chat)
  const usuario = useSelector(s => s.auth.usuario)
  const [texto, setTexto] = useState('')

  // Ao montar ou trocar de canal, busca a primeira página de mensagens
  useEffect(() => {
    if (canal) dispatch(fetchMensagens({ canal, page: 1 }))
  }, [dispatch, canal])

  // mensagens[canal] pode não existir até a primeira busca — || [] evita erro
  const msgs = mensagens[canal] || []

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

  return (
    <>
      <div className="chat-box" onScroll={handleScroll}>
        {status === 'loading' && <p className="chat-empty">Carregando mensagens antigas...</p>}
        {status !== 'loading' && msgs.length === 0 && (
          <p className="chat-empty">Nenhuma mensagem ainda. Seja o primeiro!</p>
        )}
        {msgs.map((msg, i) => {
          const isOwn = msg.authorName === usuario?.name
          return (
            <div key={msg.id || i} className={`message${isOwn ? ' message--own' : ''}`}>
              <span className="msg-user">{msg.authorName}</span>
              <span className="msg-text">{msg.text}</span>
              <span className="msg-time">{formatTime(msg.createdAt)}</span>
            </div>
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
