import { NavLink, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { fazerLogout } from '../store/authSlice'
import './Layout.css'

export default function Layout({ children }) {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const usuario = useSelector(state => state.auth.usuario)

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
          <hr />
          <a href="#">Suporte</a>
          <a href="#">Configurações</a>
        </nav>
      </aside>

      <label htmlFor="menu-toggle" className="overlay" />

      <main className="content">
        {children}
      </main>
    </>
  )
}
