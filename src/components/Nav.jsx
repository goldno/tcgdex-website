import { NavLink } from 'react-router-dom';

export default function Nav() {
  return (
    <nav className="site-nav">
      <NavLink to="/" className="nav-brand">TCGDex</NavLink>
      <div className="nav-links">
        <NavLink to="/" end className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
          Cards
        </NavLink>
        <NavLink to="/support-lines" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
          Support Lines
        </NavLink>
        <NavLink to="/momentum" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
          Momentum
        </NavLink>
      </div>
    </nav>
  );
}
