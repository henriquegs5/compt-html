import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchMensagens, setCanal, addMensagem, removerMensagem } from '../store/chatSlice'
import Layout from '../components/Layout'
import './Comunidade.css'

const CANAIS = ['geral', 'fortnite', 'rainbow', 'clash']
const LABEL  = { geral: 'GERAL', fortnite: 'FORTNITE', rainbow: 'RAINBOW SIX', clash: 'CLASH ROYALE' }

function getTime() {
  const d = new Date()
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

export default function Comunidade() {
  const dispatch   = useDispatch()
  const { mensagens, canalAtivo, status } = useSelector(s => s.chat)
  const usuario    = useSelector(s => s.auth.usuario)
  const [texto, setTexto] = useState('')

  useEffect(() => {
    dispatch(fetchMensagens(canalAtivo))
  }, [dispatch, canalAtivo])

  const msgs = mensagens[canalAtivo] || []

  function handleCanal(canal) {
    dispatch(setCanal(canal))
  }
  function apagarMensagem(index){
    dispatch(removerMensagem({canal:canalAtivo,index}))
  }

  function enviar() {
    const text = texto.trim()
    if (!text) return
    dispatch(addMensagem({
      canal: canalAtivo,
      mensagem: { user: usuario?.name ?? 'Você', text, time: getTime() }
    }))
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

      <div className="chat-box" id="chatBox">
        {status === 'loading' && <p className="chat-empty">Carregando mensagens...</p>}
        {status !== 'loading' && msgs.length === 0 && (
          <p className="chat-empty">Nenhuma mensagem ainda. Seja o primeiro!</p>
        )}
        {msgs.map((msg, i) => {
          const isOwn = msg.user === usuario?.name
          return (
            <div key={i} className={`message${isOwn ? ' message--own' : ''}`}>
              <span className="msg-user">{msg.user}</span>
              <span className="msg-text">{msg.text}</span>
              <span className="msg-time">{msg.time}</span>
              {isOwn && (<button className="msg-delete-btn" 
                          onClick={() => apagarMensagem(i)}>🗑️</button>
              )}
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
