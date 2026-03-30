import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, Link } from 'react-router-dom'
import { fazerCadastro, limparErro } from '../store/authSlice'
import './Login.css'

export default function Cadastro() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { erro, status } = useSelector(s => s.auth)

  const [nome, setNome]         = useState('')
  const [email, setEmail]       = useState('')
  const [senha, setSenha]       = useState('')
  const [confirma, setConfirma] = useState('')

  function validar() {
    if (nome.length < 2)              return 'Nome deve ter ao menos 2 caracteres.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'E-mail inválido.'
    if (senha.length < 6)             return 'Senha deve ter ao menos 6 caracteres.'
    if (senha !== confirma)           return 'As senhas não coincidem.'
    return null
  }

  async function handleSubmit(e) {
    e.preventDefault()
    dispatch(limparErro())
    const erroLocal = validar()
    if (erroLocal) return  // o Redux vai exibir isso, mas validação básica aqui
    const resultado = await dispatch(fazerCadastro({ nome, email, senha }))
    if (fazerCadastro.fulfilled.match(resultado)) {
      navigate('/')
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">COMPT</div>
        <p className="auth-subtitle">Crie sua conta gratuitamente</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          {erro && <div className="auth-error">{erro}</div>}

          <div className="auth-field">
            <label htmlFor="cad-nome">Nome de usuário</label>
            <input id="cad-nome" type="text" value={nome} onChange={e => setNome(e.target.value)} placeholder="SeuNick" required />
          </div>

          <div className="auth-field">
            <label htmlFor="cad-email">E-mail</label>
            <input id="cad-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" required />
          </div>

          <div className="auth-field">
            <label htmlFor="cad-senha">Senha</label>
            <input id="cad-senha" type="password" value={senha} onChange={e => setSenha(e.target.value)} placeholder="mín. 6 caracteres" required />
          </div>

          <div className="auth-field">
            <label htmlFor="cad-confirma">Confirmar senha</label>
            <input id="cad-confirma" type="password" value={confirma} onChange={e => setConfirma(e.target.value)} placeholder="repita a senha" required />
          </div>

          <button className="btn-auth" type="submit" disabled={status === 'loading'}>
            <span>{status === 'loading' ? 'Aguarde...' : 'Criar conta'}</span>
          </button>
        </form>

        <p className="auth-link">
          Já tem conta? <Link to="/login">Entrar</Link>
        </p>
      </div>
    </div>
  )
}
