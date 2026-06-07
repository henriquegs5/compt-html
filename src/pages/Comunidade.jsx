import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchMensagens, setCanal, postMensagem } from '../store/chatSlice'
import Layout from '../components/Layout'
import './Comunidade.css'
//maia
const CANAIS = ['geral', 'fortnite', 'rainbow', 'clash']
const LABEL  = { geral: 'GERAL', fortnite: 'FORTNITE', rainbow: 'RAINBOW SIX', clash: 'CLASH ROYALE' }

function formatTime(dateString) {
  if (!dateString) return ''
  const d = new Date(dateString)
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

export default function Comunidade() {
  const dispatch   = useDispatch()
  const { mensagens, canalAtivo, status, page, hasMore } = useSelector(s => s.chat)
  const usuario    = useSelector(s => s.auth.usuario)
  const [texto, setTexto] = useState('')

  useEffect(() => {
    // Busca página 1 ao entrar no canal
    dispatch(fetchMensagens({ canal: canalAtivo, page: 1 }))
  }, [dispatch, canalAtivo])

  const msgs = mensagens[canalAtivo] || []

  function handleCanal(canal) {
    dispatch(setCanal(canal))
  }

  function handleScroll(e) {
    // Se o scroll chegou no topo, busca mensagens mais antigas (próxima página)
    if (e.target.scrollTop === 0 && hasMore[canalAtivo] && status !== 'loading') {
      const nextPage = page[canalAtivo] + 1
      dispatch(fetchMensagens({ canal: canalAtivo, page: nextPage }))
    }
  }

  function enviar() {
    const text = texto.trim()
    if (!text) return
    // Usa a API real para enviar e salvar a mensagem no MongoDB
    dispatch(postMensagem({ canal: canalAtivo, text }))
    setTexto('')
  }

  return (
    <Layout>
      <h1 className="title">Comunidade</h1>

      <div className="chat-tabs">
        {CANAIS.map(c => (
          <button
            key={c}
            className={`tab${canalAtivo === c ? ' active' : ''}`}
            onClick={() => handleCanal(c)}
          >
            {LABEL[c]}
          </button>
        ))}
      </div>

      <div className="chat-box" id="chatBox" onScroll={handleScroll}>
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
          id="chatInput"
          value={texto}
          onChange={e => setTexto(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && enviar()}
          placeholder="Digite sua mensagem..."
        />
        <button onClick={enviar}>Enviar</button>
      </div>
    </Layout>
  )
}
