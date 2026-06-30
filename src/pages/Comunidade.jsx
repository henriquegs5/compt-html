import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchCanais, criarCanal, excluirCanal, setCanal } from '../store/chatSlice'
import Layout from '../components/Layout'
import Chat from '../components/Chat'
import './Comunidade.css'

export default function Comunidade() {
  const dispatch   = useDispatch()
  const canais     = useSelector(s => s.chat.canais)
  const canalAtivo = useSelector(s => s.chat.canalAtivo)
  const usuario    = useSelector(s => s.auth.usuario)

  // Admin e moderador podem criar/excluir canais
  const podeGerenciar = usuario?.role === 'admin' || usuario?.role === 'moderador'

  // Carrega a lista de canais ao entrar na página
  useEffect(() => {
    dispatch(fetchCanais())
  }, [dispatch])

  function handleCanal(canal) {
    dispatch(setCanal(canal))
  }

  // Cria um canal pedindo o nome ao admin/moderador
  async function handleCriar() {
    const label = window.prompt('Nome do novo canal:')
    if (!label || !label.trim()) return
    try {
      await dispatch(criarCanal(label.trim())).unwrap()
    } catch (err) {
      alert(`Não foi possível criar o canal: ${err}`)
    }
  }

  // Exclui um canal (pede confirmação). stopPropagation evita trocar de aba.
  async function handleExcluir(e, nome) {
    e.stopPropagation()
    if (!window.confirm(`Excluir o canal "${nome}" e todas as suas mensagens?`)) return
    try {
      await dispatch(excluirCanal(nome)).unwrap()
    } catch (err) {
      alert(`Não foi possível excluir o canal: ${err}`)
    }
  }

  return (
    <Layout>
      <h1 className="title">Comunidade</h1>

      <div className="chat-tabs">
        {canais.map(c => (
          <button
            key={c.nome}
            className={`tab${canalAtivo === c.nome ? ' active' : ''}`}
            onClick={() => handleCanal(c.nome)}
          >
            {c.label}
            {/* Botão de excluir — só admin/mod e nunca no canal 'geral' */}
            {podeGerenciar && c.nome !== 'geral' && (
              <span
                className="tab-excluir"
                title="Excluir canal"
                onClick={(e) => handleExcluir(e, c.nome)}
              >
                ✕
              </span>
            )}
          </button>
        ))}

        {/* Botão de criar canal — só admin/moderador */}
        {podeGerenciar && (
          <button className="tab tab-novo" onClick={handleCriar} title="Criar canal">
            + Novo canal
          </button>
        )}
      </div>

      {/* A caixa de mensagens e o input vêm do componente Chat,
          reutilizado também na página do curso. */}
      {canalAtivo && <Chat canal={canalAtivo} />}
    </Layout>
  )
}
