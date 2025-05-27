import React from "react";

// Sidebar is sticky and styled for modern dashboard look
const SidebarCloseButton = ({ onClick }) => (
  <button
    className="absolute top-3 right-3 p-2 rounded-full hover:bg-blue-700 focus:outline-none transition-transform duration-150 active:scale-90 active:bg-blue-800"
    aria-label="Close sidebar"
    onClick={onClick}
    style={{ background: 'rgba(255,255,255,0.08)' }}
  >
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  </button>
);

export default function Sidebar({ role, onNav, selected, open = true, onClose }) {
  // Responsive: hidden on mobile unless open, overlay for mobile
  // Desktop: always visible
  return (
    <>
      {/* Overlay for mobile */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-40 z-40 transition-opacity duration-300 md:hidden ${open ? 'block' : 'hidden'}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={`fixed md:sticky left-0 top-0 z-50 h-full min-h-screen w-64 bg-gradient-to-b from-blue-900 to-blue-800 text-white flex flex-col py-8 px-4 shadow-2xl
          transition-all duration-300 ease-in-out
          ${open ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0 pointer-events-none'}
          md:translate-x-0 md:opacity-100 md:pointer-events-auto`
        }
        style={{
          transition: 'all 0.3s',
        }}
      >
        {/* Close button at top right */}
        <SidebarCloseButton onClick={onClose} />
        <div className="flex items-center gap-2 mb-10 px-2 mt-2">
          <img src="/favicon.ico" alt="Logo" className="w-8 h-8" />
          <h2 className="text-2xl font-bold tracking-wide">Monthly Consumption</h2>
        </div>
        <nav className="flex flex-col gap-2">
          <button
            className={`text-left px-4 py-2 rounded transition-colors ${selected === 'dashboard' ? 'bg-blue-800' : 'hover:bg-blue-700'}`}
            onClick={() => { onNav('dashboard'); if (onClose) onClose(); }}
          >
            Home
          </button>
          <button
            className={`text-left px-4 py-2 rounded transition-colors ${selected === 'profile' ? 'bg-blue-800' : 'hover:bg-blue-700'}`}
            onClick={() => { onNav('profile'); if (onClose) onClose(); }}
          >
            Profile
          </button>
          {role === 'superadmin' && (
            <>
              <button
                className={`text-left px-4 py-2 rounded transition-colors ${selected === 'admin-management' ? 'bg-blue-800' : 'hover:bg-blue-700'}`}
                onClick={() => { onNav('admin-management'); if (onClose) onClose(); }}
              >
                Admin Management
              </button>
              <button
                className={`text-left px-4 py-2 rounded transition-colors ${selected === 'user-management' ? 'bg-blue-800' : 'hover:bg-blue-700'}`}
                onClick={() => { onNav('user-management'); if (onClose) onClose(); }}
              >
                User Management
              </button>
            </>
          )}
          {role === 'admin' && (
            <button className={`text-left px-4 py-2 rounded transition-colors ${selected === 'user-management' ? 'bg-blue-800' : 'hover:bg-blue-700'}`}
              onClick={() => { onNav('user-management'); if (onClose) onClose(); }}
            >User Management</button>
          )}
        </nav>
      </aside>
    </>
  );
}
