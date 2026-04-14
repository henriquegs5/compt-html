import { NavLink, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fazerLogout } from '../store/authSlice'
import './Layout.css'

export default function Layout({ children }) {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const usuario = useSelector(state => state.auth.usuario)

  // Verifica se o usuário logado é admin ou moderador
  // para exibir o link do painel de administração no sidebar
  const isAdminOuMod = usuario?.role === 'admin' || usuario?.role === 'moderador'
  
  // Recupera a cor salva no localStorage ao carregar
  useEffect(() => {
    const savedColor = localStorage.getItem('primaryColor')
    if (savedColor) {
      document.documentElement.style.setProperty('--primary', savedColor)
    }
    
  }, [])
  function handleLogout() {
    dispatch(fazerLogout())
    navigate('/login')
  }

  return (
    <>
      <input type="checkbox" id="menu-toggle" />

      <header className="topbar">
        <label htmlFor="menu-toggle" className="menu-btn">☰</label>

        <div className="logo-area">
          <span className="logo-text">COMPT</span>
        </div>


        <div className="user-area">
          {/* Badge exibindo o cargo do usuário ao lado do nome */}
          {usuario?.role && (
            <span className={`role-badge role-badge--${usuario.role}`}>
              {usuario.role}
            </span>
          )}
          <span className="username">{usuario?.name ?? 'Usuário'}</span>
          <img
            className="avatar"
            src={`https://i.pravatar.cc/40?u=${usuario?.uid ?? 'default'}`}
            alt="foto do usuário"
          />
          <button className="btn-logout" onClick={handleLogout} title="Sair">⏻</button>
        </div>
      </header>

      <aside className="sidebar">
        <nav>
          <NavLink to="/"            end>Início</NavLink>
          <NavLink to="/progressos">Meus progressos</NavLink>
          <NavLink to="/comunidade">Comunidade</NavLink>
          <NavLink to="/estatisticas">Estatísticas</NavLink>
          <NavLink to="/perfil">Perfil</NavLink>
          {/* Link do painel admin — visível apenas para admin e moderador */}
          {isAdminOuMod && (
            <NavLink to="/admin">Painel Admin</NavLink>
          )}
          <hr />
          <NavLink to="/config">Configurações</NavLink>
        </nav>
      </aside>

      <label htmlFor="menu-toggle" className="overlay" />

      <main className="content">
        {children}
      </main>
    </>
  )
}
