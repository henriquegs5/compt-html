import { useState } from 'react'
import * as Yup from 'yup'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, Link } from 'react-router-dom'
import { fazerLogin, limparErro } from '../store/authSlice'
import { useValidacaoForm } from '../hooks/useValidacaoForm'
import './Login.css'

// Schema Yup: define as regras de validação do formulário de login.
// Fica fora do componente para não ser recriado a cada render.
const loginSchema = Yup.object({
  email: Yup.string()
    .email('E-mail inválido.')
    .required('E-mail é obrigatório.'),
  senha: Yup.string()
    .min(6, 'Senha deve ter ao menos 6 caracteres.')
    .required('Senha é obrigatória.'),
})

export default function Login() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { erro, status } = useSelector(s => s.auth)

  const [email, setEmail]               = useState('')
  const [senha, setSenha]               = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)

  // Hook customizado: recebe o schema e devolve errosForm, validar e limparCampo.
  // Toda a lógica de Yup (abortEarly, montagem do objeto de erros) fica encapsulada lá.
  const { errosForm, validar, limparCampo } = useValidacaoForm(loginSchema)

  async function handleSubmit(e) {
    e.preventDefault()
    dispatch(limparErro())

    // Chama o hook — se retornar false os erros já foram setados internamente
    const valido = await validar({ email, senha })
    if (!valido) return

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
          {/* Erro vindo do Redux (e-mail não encontrado, senha errada etc.) */}
          {erro && (
            <div className="auth-error" id="auth-error">{erro}</div>
          )}

          <div className="auth-field">
            <label htmlFor="login-email">E-mail</label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); limparCampo('email') }}
              placeholder="seu@email.com"
            />
            {errosForm.email && <span className="campo-erro">{errosForm.email}</span>}
          </div>

          <div className="auth-field">
            <label htmlFor="login-senha">Senha</label>
            <div className="input-with-toggle">
              <input
                id="login-senha"
                type={mostrarSenha ? 'text' : 'password'}
                value={senha}
                onChange={e => { setSenha(e.target.value); limparCampo('senha') }}
                placeholder="••••••"
              />
              <button type="button" className="toggle-senha" onClick={() => setMostrarSenha(v => !v)}>
                {mostrarSenha ? '🙈' : '👁'}
              </button>
            </div>
            {errosForm.senha && <span className="campo-erro">{errosForm.senha}</span>}
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
