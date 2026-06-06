import { useState } from 'react'
import * as Yup from 'yup'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, Link } from 'react-router-dom'
import { fazerCadastro, limparErro } from '../store/authSlice'
import { useValidacaoForm } from '../hooks/useValidacaoForm'
import './Login.css'

// Schema Yup: regras de validação do formulário de cadastro.
// Yup.ref('senha') cria uma referência dinâmica ao campo senha —
// o Yup resolve o valor dele na hora de checar o campo confirma.
const cadastroSchema = Yup.object({
  nome: Yup.string()
    .min(2, 'Nome deve ter ao menos 2 caracteres.')
    .required('Nome é obrigatório.'),
  email: Yup.string()
    .email('E-mail inválido.')
    .required('E-mail é obrigatório.'),
  senha: Yup.string()
    .min(6, 'Senha deve ter ao menos 6 caracteres.')
    .required('Senha é obrigatória.'),
  confirma: Yup.string()
    .oneOf([Yup.ref('senha')], 'As senhas não coincidem.')
    .required('Confirmação de senha é obrigatória.'),
})

export default function Cadastro() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { erro, status } = useSelector(s => s.auth)

  const [nome, setNome]         = useState('')
  const [email, setEmail]       = useState('')
  const [senha, setSenha]       = useState('')
  const [confirma, setConfirma] = useState('')

  // Hook customizado: passa o schema e recebe de volta os utilitários de validação.
  // O componente não precisa saber nada sobre como o Yup funciona internamente.
  const { errosForm, validar, limparCampo } = useValidacaoForm(cadastroSchema)

  async function handleSubmit(e) {
    e.preventDefault()
    dispatch(limparErro())

    // Valida todos os campos — se falhar, errosForm já foi atualizado pelo hook
    const valido = await validar({ nome, email, senha, confirma })
    if (!valido) return

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
          {/* Erro vindo do Redux (e-mail já cadastrado, nome em uso etc.) */}
          {erro && <div className="auth-error">{erro}</div>}

          <div className="auth-field">
            <label htmlFor="cad-nome">Nome de usuário</label>
            <input
              id="cad-nome"
              type="text"
              value={nome}
              onChange={e => { setNome(e.target.value); limparCampo('nome') }}
              placeholder="SeuNick"
            />
            {errosForm.nome && <span className="campo-erro">{errosForm.nome}</span>}
          </div>

          <div className="auth-field">
            <label htmlFor="cad-email">E-mail</label>
            <input
              id="cad-email"
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); limparCampo('email') }}
              placeholder="seu@email.com"
            />
            {errosForm.email && <span className="campo-erro">{errosForm.email}</span>}
          </div>

          <div className="auth-field">
            <label htmlFor="cad-senha">Senha</label>
            <input
              id="cad-senha"
              type="password"
              value={senha}
              onChange={e => { setSenha(e.target.value); limparCampo('senha') }}
              placeholder="mín. 6 caracteres"
            />
            {errosForm.senha && <span className="campo-erro">{errosForm.senha}</span>}
          </div>

          <div className="auth-field">
            <label htmlFor="cad-confirma">Confirmar senha</label>
            <input
              id="cad-confirma"
              type="password"
              value={confirma}
              onChange={e => { setConfirma(e.target.value); limparCampo('confirma') }}
              placeholder="repita a senha"
            />
            {errosForm.confirma && <span className="campo-erro">{errosForm.confirma}</span>}
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
