import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, Link } from 'react-router-dom'
import { fazerLogin, limparErro } from '../store/authSlice'
import './Login.css'

export default function Login() {
  const dispatch   = useDispatch()
  const navigate   = useNavigate()
  const { erro, status } = useSelector(s => s.auth)

  const [email, setEmail]       = useState('')
  const [senha, setSenha]       = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    dispatch(limparErro())
    const resultado = await dispatch(fazerLogin({ email, senha }))
    if (fazerLogin.fulfilled.match(resultado)) {
      navigate('/')
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">COMPT</div>
        <p className="auth-subtitle">Plataforma de evolução competitiva</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          {erro && (
            <div className="auth-error" id="auth-error">{erro}</div>
          )}

          <div className="auth-field">
            <label htmlFor="login-email">E-mail</label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
            />
          </div>

          <div className="auth-field">
            <label htmlFor="login-senha">Senha</label>
            <div className="input-with-toggle">
              <input
                id="login-senha"
                type={mostrarSenha ? 'text' : 'password'}
                value={senha}
                onChange={e => setSenha(e.target.value)}
                placeholder="••••••"
                required
              />
              <button type="button" className="toggle-senha" onClick={() => setMostrarSenha(v => !v)}>
                {mostrarSenha ? '🙈' : '👁'}
              </button>
            </div>
          </div>

          <button className="btn-auth" type="submit" disabled={status === 'loading'}>
            <span>{status === 'loading' ? 'Aguarde...' : 'Entrar'}</span>
          </button>
        </form>

        <p className="auth-link">
          Não tem conta? <Link to="/cadastro">Cadastre-se</Link>
        </p>
      </div>
    </div>
  )
}
