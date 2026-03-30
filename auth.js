// ===================================================
//  COMPT — auth.js
//  Sistema de autenticação via localStorage
//  Cobre: cadastro, login, logout, proteção de rota
// ===================================================

// ---- CONSTANTES ----

const AUTH_USERS_KEY   = 'compt_users'      // banco de usuários
const AUTH_SESSION_KEY = 'compt_session'    // sessão atual
const AUTH_REDIRECT    = 'login.html'       // página de login
const HOME_REDIRECT    = 'index.html'       // após login

// ---- UTILITÁRIOS ----

function authGetUsers() {
  try { return JSON.parse(localStorage.getItem(AUTH_USERS_KEY)) || {} }
  catch { return {} }
}

function authSaveUsers(users) {
  localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(users))
}

function authGetSession() {
  try { return JSON.parse(localStorage.getItem(AUTH_SESSION_KEY)) }
  catch { return null }
}

function authSaveSession(user) {
  localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(user))
}

function authClearSession() {
  localStorage.removeItem(AUTH_SESSION_KEY)
}

// Hash simples para não salvar senha em texto puro
function hashSenha(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash |= 0
  }
  return hash.toString(16)
}

function showError(msg) {
  const el = document.getElementById('auth-error')
  if (!el) return
  el.textContent = msg
  el.style.display = 'block'
  el.classList.add('auth-error--shake')
  setTimeout(() => el.classList.remove('auth-error--shake'), 400)
}

function hideError() {
  const el = document.getElementById('auth-error')
  if (el) el.style.display = 'none'
}

function setBtnLoading(loading) {
  const btn = document.querySelector('.btn-auth')
  if (!btn) return
  btn.disabled = loading
  btn.querySelector('span').textContent = loading ? 'Aguarde...' : btn.dataset.label || btn.querySelector('span').textContent
}

// Mostrar/ocultar senha
function toggleSenha(id, btn) {
  const input = document.getElementById(id)
  if (!input) return
  const isPassword = input.type === 'password'
  input.type = isPassword ? 'text' : 'password'
  btn.textContent = isPassword ? '🙈' : '👁'
}

// ---- VALIDAÇÕES ----

function validarEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function validarNome(nome) {
  return nome.length >= 2 && nome.length <= 30 && /^[a-zA-Z0-9_\-. ]+$/.test(nome)
}

// ---- CADASTRO ----

function fazerCadastro() {
  hideError()

  const nome     = document.getElementById('cad-nome')?.value.trim()    || ''
  const email    = document.getElementById('cad-email')?.value.trim()   || ''
  const senha    = document.getElementById('cad-senha')?.value          || ''
  const confirma = document.getElementById('cad-confirma')?.value       || ''

  // Validações
  if (!nome)              return showError('Informe um nome de usuário.')
  if (!validarNome(nome)) return showError('Nome inválido. Use letras, números e _ apenas.')
  if (!email)             return showError('Informe seu e-mail.')
  if (!validarEmail(email)) return showError('E-mail inválido.')
  if (senha.length < 6)   return showError('A senha deve ter no mínimo 6 caracteres.')
  if (senha !== confirma) return showError('As senhas não coincidem.')

  const users = authGetUsers()

  // Verifica e-mail duplicado
  const emailExiste = Object.values(users).some(u => u.email === email.toLowerCase())
  if (emailExiste) return showError('Este e-mail já está cadastrado.')

  // Verifica nome duplicado
  const nomeExiste = Object.values(users).some(
    u => u.name.toLowerCase() === nome.toLowerCase()
  )
  if (nomeExiste) return showError('Este nome de usuário já está em uso.')

  // Cria ID único
  const uid = 'user_' + Date.now()

  // Salva usuário
  users[uid] = {
    uid,
    name:      nome,
    email:     email.toLowerCase(),
    senha:     hashSenha(senha),
    bio:       'Jogador competitivo na plataforma Compt.',
    avatarUrl: `https://i.pravatar.cc/40?u=${uid}`,
    bannerUrl: '',
    stats: {
      fortnite: { rank: '-',  wins: 0,   kills: 0,     matches: 0 },
      rainbow:  { rank: '-',  kd: '0.00', kills: 0,    matches: 0 },
      clash:    { trophies: 0, wins: 0,  losses: 0,    matches: 0 }
    },
    modules:  {},
    conquistas: [],
    criadoEm: new Date().toISOString()
  }

  authSaveUsers(users)

  // Inicia sessão
  authSaveSession({ uid, name: nome, email: email.toLowerCase() })

  // Redireciona
  window.location.href = HOME_REDIRECT
}

// ---- LOGIN ----

function fazerLogin() {
  hideError()

  const email = document.getElementById('login-email')?.value.trim() || ''
  const senha = document.getElementById('login-senha')?.value        || ''

  if (!email) return showError('Informe seu e-mail.')
  if (!senha) return showError('Informe sua senha.')

  const users = authGetUsers()

  // Procura usuário pelo e-mail
  const user = Object.values(users).find(u => u.email === email.toLowerCase())

  if (!user)                          return showError('E-mail não encontrado.')
  if (user.senha !== hashSenha(senha)) return showError('Senha incorreta.')

  // Inicia sessão
  authSaveSession({ uid: user.uid, name: user.name, email: user.email })

  window.location.href = HOME_REDIRECT
}

// ---- LOGOUT ----

function fazerLogout() {
  authClearSession()
  window.location.href = AUTH_REDIRECT
}

// ---- PROTEÇÃO DE ROTA ----
// Chame esta função no início de cada página protegida
// (já é chamada automaticamente pelo script.js via initAuth)

function requireAuth() {
  const session = authGetSession()
  const isAuthPage = window.location.pathname.includes('login') ||
                     window.location.pathname.includes('cadastro')

  if (!session && !isAuthPage) {
    window.location.href = AUTH_REDIRECT
    return null
  }

  if (session && isAuthPage) {
    window.location.href = HOME_REDIRECT
    return null
  }

  return session
}

// ---- DADOS DO USUÁRIO LOGADO ----

function getUsuarioLogado() {
  const session = authGetSession()
  if (!session) return null
  const users = authGetUsers()
  return users[session.uid] || null
}

function salvarUsuario(dadosAtualizados) {
  const session = authGetSession()
  if (!session) return
  const users = authGetUsers()
  users[session.uid] = { ...users[session.uid], ...dadosAtualizados }
  authSaveUsers(users)
  // Atualiza nome na sessão se mudou
  if (dadosAtualizados.name) {
    authSaveSession({ ...session, name: dadosAtualizados.name })
  }
}

// ---- ENTER NOS FORMULÁRIOS ----

document.addEventListener('DOMContentLoaded', () => {

  // Redireciona se já logado e está na página de login/cadastro
  requireAuth()

  // Enter no login
  const loginSenha = document.getElementById('login-senha')
  if (loginSenha) {
    loginSenha.addEventListener('keypress', e => {
      if (e.key === 'Enter') fazerLogin()
    })
    document.getElementById('login-email')?.addEventListener('keypress', e => {
      if (e.key === 'Enter') fazerLogin()
    })
  }

  // Enter no cadastro
  const cadConfirma = document.getElementById('cad-confirma')
  if (cadConfirma) {
    cadConfirma.addEventListener('keypress', e => {
      if (e.key === 'Enter') fazerCadastro()
    })
  }

  // Limpa erro ao digitar
  document.querySelectorAll('.auth-field input').forEach(input => {
    input.addEventListener('input', hideError)
  })

})