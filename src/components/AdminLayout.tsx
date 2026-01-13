import { ReactNode, useState } from 'react';
import { AdminNav } from './AdminNav';
import './AdminLayout.css';

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [navOpen, setNavOpen] = useState(false);

  return (
    <div className="admin-layout">
      <button 
        className="admin-layout__menu-toggle"
        onClick={() => setNavOpen(!navOpen)}
        aria-label="Toggle menu"
      >
        <span className="admin-layout__menu-icon">☰</span>
      </button>
      {navOpen && (
        <div 
          className="admin-layout__overlay"
          onClick={() => setNavOpen(false)}
        />
      )}
      <AdminNav isOpen={navOpen} onClose={() => setNavOpen(false)} />
      <main className="admin-layout__main">
        {children}
      </main>
    </div>
  );
}
