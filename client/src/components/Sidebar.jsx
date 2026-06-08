import { NavLink } from 'react-router-dom';
import { Home, TrendingUp, BookOpen, Headphones, Settings, LogOut, MessageSquare } from 'lucide-react';

export default function Sidebar({ user, onLogout }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">Parlé</div>

      {user && (
        <div className="user-profile-sm">
          <div className="user-avatar">
            {user.picture ? (
              <img src={user.picture} alt={user.name} />
            ) : (
              user.name ? user.name[0] : 'U'
            )}
          </div>
          <div className="user-info">
            <p>Bonjour, {user.name ? user.name.split(' ')[0] : 'Student'}</p>
            <span>Niveau B2 • Intermédiaire</span>
          </div>
        </div>
      )}

      <nav className="nav-links">
        <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} end>
          <Home /> Home
        </NavLink>
        <NavLink to="/chat" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <MessageSquare /> AI Tutor Chat
        </NavLink>
        <NavLink to="/progress" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <TrendingUp /> My Progress
        </NavLink>
        <NavLink to="/grammar" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <BookOpen /> Vocab Pokedex
        </NavLink>
        <NavLink to="/audio" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Headphones /> Audio Immersion
        </NavLink>
      </nav>

      <div className="nav-links" style={{ flexGrow: 0, marginTop: 'auto' }}>
        <button className="nav-item" style={{ width: '100%', background: 'none', border: 'none', textAlign: 'left' }}>
          <Settings /> Settings
        </button>
        <button onClick={onLogout} className="nav-item" style={{ width: '100%', background: 'none', border: 'none', textAlign: 'left' }}>
          <LogOut /> Log Out
        </button>
      </div>
    </aside>
  );
}
