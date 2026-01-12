import { ReactNode } from 'react';
import { AdminNav } from './AdminNav';
import './AdminLayout.css';

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="admin-layout">
      <AdminNav />
      <main className="admin-layout__main">
        {children}
      </main>
    </div>
  );
}
