// ===================================================
//  COMPT — Script Principal
//  Cobre: Módulos, Progressos, Estatísticas,
//         Comunidade (chat) e Perfil
// ===================================================
 
// ---- UTILITÁRIOS ----
 
const $ = id => document.getElementById(id)
const $$ = sel => document.querySelectorAll(sel)
 
const store = {
  get: (key, fallback = null) => {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback }
    catch { return fallback }
  },
  set: (key, val) => localStorage.setItem(key, JSON.stringify(val))
}
 
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}
 
function getUsername() {
  return store.get('compt_profile', { name: 'Henrique' }).name
}
 
function getTime() {
  const d = new Date()
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}
 
// ---- TOAST ----
 
function toast(msg, type = 'success') {
  const t = document.createElement('div')
  t.className = `compt-toast compt-toast--${type}`
  t.innerHTML = `<span>${msg}</span>`
  document.body.appendChild(t)
  requestAnimationFrame(() => t.classList.add('compt-toast--show'))
  setTimeout(() => {
    t.classList.remove('compt-toast--show')
    setTimeout(() => t.remove(), 350)
  }, 3000)
}
 
// ---- MODAL GENÉRICO ----
 
function createModal(content) {
  const overlay = document.createElement('div')
  overlay.className = 'compt-modal-overlay'
  overlay.innerHTML = `<div class="compt-modal-card">${content}</div>`
  document.body.appendChild(overlay)
  requestAnimationFrame(() => overlay.classList.add('compt-modal-overlay--show'))
  overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(overlay) })
  return overlay
}
 
function closeModal(overlay) {
  overlay.classList.remove('compt-modal-overlay--show')
  setTimeout(() => overlay.remove(), 300)
}
 
// ---- TOPBAR: nome do usuário ----
 
function initTopbar() {
  const el = document.querySelector('.username')
  if (el) el.textContent = getUsername()
}
 
// ====================================================
//  MÓDULOS — index.html
// ====================================================
 
function initModulos() {
  const grid = document.querySelector('.module-grid')
  if (!grid) return
 
  const progress = store.get('compt_modules', {})
  const cards = grid.querySelectorAll('.module-card')
 
  cards.forEach((card, i) => {
    const id = `modulo${i + 1}`
    const status = progress[id] || 'locked'
    renderModuloBadge(card, status)
    card.addEventListener('click', () => openModuloModal(id, i + 1))
  })
}
 
function renderModuloBadge(card, status) {
  card.querySelector('.module-badge')?.remove()
  if (status === 'locked') return
  const badge = document.createElement('span')
  badge.className = `module-badge module-badge--${status}`
  badge.textContent = status === 'completed' ? '✓ Concluído' : '▶ Em andamento'
  card.appendChild(badge)
}
 
function openModuloModal(id, num) {
  const progress = store.get('compt_modules', {})
  const status = progress[id] || 'locked'
 
  const labels = {
    locked:      { btn: 'Iniciar módulo',         action: 'in-progress', icon: '▶' },
    'in-progress': { btn: 'Marcar como concluído', action: 'completed',   icon: '✓' },
    completed:   { btn: null }
  }
  const cfg = labels[status]
 
  const btnHtml = cfg.btn
    ? `<button class="btn-primary mod-action" data-action="${cfg.action}">${cfg.icon} ${cfg.btn}</button>`
    : `<p class="mod-done-msg">✓ Módulo já concluído!</p>`
 
  const overlay = createModal(`
    <div class="compt-modal-header">
      <h3>Módulo ${num}</h3>
      <span class="modal-status-label modal-status--${status}">
        ${ status === 'locked' ? 'Não iniciado' : status === 'in-progress' ? 'Em andamento' : 'Concluído' }
      </span>
    </div>
    <p class="compt-modal-sub">Gerencie seu progresso neste módulo.</p>
    <div class="compt-modal-actions">
      ${btnHtml}
      <button class="btn-secondary mod-close">Fechar</button>
    </div>
  `)
 
  overlay.querySelector('.mod-close')?.addEventListener('click', () => closeModal(overlay))
  overlay.querySelector('.mod-action')?.addEventListener('click', e => {
    const newStatus = e.target.dataset.action
    const prog = store.get('compt_modules', {})
    prog[id] = newStatus
    store.set('compt_modules', prog)
 
    // Atualiza badge no card correspondente
    const idx = parseInt(id.replace('modulo', '')) - 1
    const card = document.querySelectorAll('.module-card')[idx]
    if (card) renderModuloBadge(card, newStatus)
 
    closeModal(overlay)
    toast(newStatus === 'completed' ? '🎉 Módulo concluído!' : '▶ Módulo iniciado!')
  })
}
 
// ====================================================
//  PROGRESSOS — progressos.html
// ====================================================
 
function initProgressos() {
  const summary = document.querySelector('.progress-summary')
  if (!summary) return
 
  const progress  = store.get('compt_modules', {})
  const values    = Object.values(progress)
  const completed = values.filter(v => v === 'completed').length
  const ongoing   = values.filter(v => v === 'in-progress').length
  const videos    = completed * 3 + ongoing
 
  const cards = summary.querySelectorAll('.stat-card h3')
  if (cards[0]) animateCounter(cards[0], completed)
  if (cards[1]) animateCounter(cards[1], ongoing)
  if (cards[2]) animateCounter(cards[2], Math.max(12, videos))
 
  // Barra de progresso geral
  addOverallProgress(completed, 6)
}
 
function addOverallProgress(done, total) {
  const section = document.querySelector('.progress-summary')
  if (!section || section.querySelector('.overall-progress')) return
 
  const pct = Math.round((done / total) * 100)
  const wrap = document.createElement('div')
  wrap.className = 'overall-progress'
  wrap.innerHTML = `
    <div class="overall-progress__header">
      <span>Progresso geral do curso</span>
      <span class="overall-progress__pct">${pct}%</span>
    </div>
    <div class="overall-progress__bar">
      <div class="overall-progress__fill" style="width:0%"></div>
    </div>
  `
  section.appendChild(wrap)
 
  // Anima a barra após inserir
  setTimeout(() => {
    wrap.querySelector('.overall-progress__fill').style.width = pct + '%'
  }, 200)
}
 
// ====================================================
//  ESTATÍSTICAS — estatisticas.html
// ====================================================
 
function initEstatisticas() {
  const grid = document.querySelector('.stats-grid')
  if (!grid) return
 
  // Contadores animados para os números
  grid.querySelectorAll('.stats-list strong').forEach(el => {
    const raw = el.textContent.replace(/\./g, '').replace(',', '.')
    const num = parseFloat(raw)
    if (isNaN(num)) return
    const isDecimal = el.textContent.includes(',')
    animateCounter(el, num, isDecimal)
  })
 
  // Anima os ranks com fade + slide
  grid.querySelectorAll('.rank-box h2').forEach((el, i) => {
    el.style.cssText = 'opacity:0;transform:translateY(12px);transition:opacity .5s ease,transform .5s ease'
    setTimeout(() => { el.style.opacity = '1'; el.style.transform = 'translateY(0)' }, 200 + i * 150)
  })
 
  // Adiciona gráfico de win-rate no Fortnite
  addWinRateChart()
}
 
function addWinRateChart() {
  const card = document.querySelector('.stats-grid .game-stats')
  if (!card || card.querySelector('.win-rate-chart')) return
 
  const wins    = 86
  const matches = 540
  const wr      = Math.round((wins / matches) * 100)
 
  const wrap = document.createElement('div')
  wrap.className = 'win-rate-chart'
  wrap.innerHTML = `
    <p class="wr-label">Win Rate</p>
    <div class="wr-ring-wrap">
      <svg viewBox="0 0 44 44" class="wr-ring">
        <circle cx="22" cy="22" r="18" fill="none" stroke="#242a33" stroke-width="4"/>
        <circle cx="22" cy="22" r="18" fill="none" stroke="var(--primary)" stroke-width="4"
          stroke-dasharray="${(wr / 100) * 113} 113"
          stroke-dashoffset="28"
          stroke-linecap="round"
          class="wr-arc"/>
      </svg>
      <span class="wr-pct">${wr}%</span>
    </div>
  `
  card.querySelector('.stats-list').before(wrap)
}
 
// ====================================================
//  COMUNIDADE — comunidade.html
// ====================================================
 
const tabMap = { 0: 'geral', 1: 'fortnite', 2: 'rainbow', 3: 'clash' }
 
// Mensagens iniciais por canal (seed)
const SEED = {
  geral: [
    { user: 'MatheusGG', text: 'Galera, alguém terminou o módulo 3?', time: '14:22' },
    { user: 'CarolFPS',  text: 'Sim! O conteúdo de game sense é incrível',  time: '14:25' },
    { user: 'rafa_plays', text: 'Recomendo assistir duas vezes, tem muito detalhe', time: '14:31' }
  ],
  fortnite: [
    { user: 'ZeroBuilds', text: 'Alguém treina no Aim Lab antes das partidas?', time: '13:10' },
    { user: 'Storm_King', text: 'Todo dia! 30 min antes de entrar — faz diferença', time: '13:15' },
    { user: 'BruhMoment', text: 'Qual sensibilidade vocês usam?', time: '13:40' }
  ],
  rainbow: [
    { user: 'SiegeMain', text: 'Melhores ops para defesa no Platinum?', time: '11:40' },
    { user: 'TwitchPro',  text: 'Jäger e Bandit são fundamentais', time: '11:45' },
    { user: 'GadgetKing', text: 'Clash no ataque também fecha muito', time: '11:52' }
  ],
  clash: [
    { user: 'CrownGG',   text: 'Qual deck tá dominando o ladder agora?', time: '09:20' },
    { user: 'Electro_P', text: 'Goblin Giant + Sparky ainda é absurdo', time: '09:25' },
    { user: 'CrownGG',   text: 'Vou testar. Obrigado!', time: '09:27' }
  ]
}
 
let currentTab = 'geral'
 
function initComunidade() {
  const chatBox   = $('chatBox')
  const chatInput = $('chatInput')
  if (!chatBox || !chatInput) return
 
  renderChat()
 
  $$('.tab').forEach((btn, i) => {
    btn.addEventListener('click', () => {
      $$('.tab').forEach(t => t.classList.remove('active'))
      btn.classList.add('active')
      currentTab = tabMap[i]
      renderChat()
    })
  })
 
  const sendBtn = document.querySelector('.chat-input button')
  if (sendBtn) sendBtn.addEventListener('click', enviarMensagem)
  chatInput.addEventListener('keypress', e => { if (e.key === 'Enter') enviarMensagem() })
}
 
function getMsgs(tab) {
  const saved = store.get(`compt_chat_${tab}`, [])
  return [...(SEED[tab] || []), ...saved]
}
 
function renderChat() {
  const chatBox = $('chatBox')
  if (!chatBox) return
 
  chatBox.innerHTML = ''
  const msgs = getMsgs(currentTab)
 
  if (msgs.length === 0) {
    chatBox.innerHTML = '<p class="chat-empty">Nenhuma mensagem ainda. Seja o primeiro!</p>'
    return
  }
 
  msgs.forEach(msg => {
    const isOwn = msg.user === getUsername()
    const div   = document.createElement('div')
    div.className = `message${isOwn ? ' message--own' : ''}`
    div.innerHTML = `
      <span class="msg-user">${escapeHtml(msg.user)}</span>
      <span class="msg-text">${escapeHtml(msg.text)}</span>
      <span class="msg-time">${msg.time}</span>
    `
    chatBox.appendChild(div)
  })
 
  chatBox.scrollTop = chatBox.scrollHeight
}
 
function enviarMensagem() {
  const chatInput = $('chatInput')
  if (!chatInput) return
 
  const text = chatInput.value.trim()
  if (!text) return
 
  const msg = { user: getUsername(), text, time: getTime() }
 
  const saved = store.get(`compt_chat_${currentTab}`, [])
  saved.push(msg)
  store.set(`compt_chat_${currentTab}`, saved)
 
  chatInput.value = ''
  renderChat()
}
 
// ====================================================
//  PERFIL — perfil.html
// ====================================================
 
function initPerfil() {
  const card = document.querySelector('.profile-card')
  if (!card) return
 
  const profile = store.get('compt_profile', {
    name: 'Henrique',
    bio: 'Jogador competitivo. Focado em melhorar mecânica e game sense.'
  })
 
  const nameEl = card.querySelector('.profile-info h2')
  const bioEl  = card.querySelector('.profile-bio')
  if (nameEl) nameEl.textContent = profile.name
  if (bioEl)  bioEl.textContent  = profile.bio
 
  const editBtn = card.querySelector('.edit-btn')
  if (editBtn) editBtn.addEventListener('click', () => openPerfilModal(profile))
}
 
function openPerfilModal(profile) {
  const overlay = createModal(`
    <h3 style="margin-bottom:1.2rem">Editar Perfil</h3>
    <div class="compt-modal-field">
      <label>Nome</label>
      <input type="text" id="editName" value="${escapeHtml(profile.name)}" maxlength="30">
    </div>
    <div class="compt-modal-field">
      <label>Bio</label>
      <textarea id="editBio" rows="3">${escapeHtml(profile.bio)}</textarea>
    </div>
    <div class="compt-modal-actions" style="margin-top:1.4rem">
      <button class="btn-primary pf-save">Salvar</button>
      <button class="btn-secondary pf-cancel">Cancelar</button>
    </div>
  `)
 
  overlay.querySelector('.pf-cancel').addEventListener('click', () => closeModal(overlay))
 
  overlay.querySelector('.pf-save').addEventListener('click', () => {
    const name = overlay.querySelector('#editName').value.trim() || 'Henrique'
    const bio  = overlay.querySelector('#editBio').value.trim()
    const updated = { name, bio }
    store.set('compt_profile', updated)
 
    // Atualiza DOM
    const card = document.querySelector('.profile-card')
    card.querySelector('.profile-info h2').textContent = name
    card.querySelector('.profile-bio').textContent     = bio
    document.querySelector('.username').textContent    = name
 
    closeModal(overlay)
    toast('Perfil atualizado com sucesso!')
  })
}
 
// ====================================================
//  CONTADOR ANIMADO
// ====================================================
 
function animateCounter(el, target, isDecimal = false) {
  const duration = 900
  const start    = performance.now()
 
  const tick = now => {
    const p    = Math.min((now - start) / duration, 1)
    const ease = 1 - Math.pow(1 - p, 3)
    const val  = target * ease
 
    el.textContent = isDecimal
      ? val.toFixed(2).replace('.', ',')
      : Math.round(val).toLocaleString('pt-BR')
 
    if (p < 1) requestAnimationFrame(tick)
  }
 
  requestAnimationFrame(tick)
}
 
// ====================================================
//  INIT
// ====================================================
 
document.addEventListener('DOMContentLoaded', () => {
  initTopbar()
  initModulos()
  initProgressos()
  initEstatisticas()
  initComunidade()
  initPerfil()
})