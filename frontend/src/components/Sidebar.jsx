import React from "react";
import { NavLink, useLocation } from 'react-router-dom';

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

export default function Sidebar({ role, fullName, open = true, onClose, onLogout }) {
  const location = useLocation();
  const path = location.pathname;

  // Helper to check if a route is active
  const isActive = (route) => path === route;

  // --- Dropdown state for Dashboard (PMO) ---
  const [dashboardOpen, setDashboardOpen] = React.useState(false);
  // Sync dropdown open/close state to current path
  React.useEffect(() => {
    if (
      path.startsWith('/' + role + '/fuel-consumption') ||
      path.startsWith('/' + role + '/electricity-consumption')
    ) {
      setDashboardOpen(true);
    } else {
      setDashboardOpen(false);
    }
  }, [path, role]);

  // Responsive: hidden on mobile unless open, overlay for mobile
  // Desktop: always visible
  return (
    <aside
      className={`fixed md:sticky left-0 top-0 z-50 h-full min-h-screen bg-gradient-to-b from-blue-900 to-blue-800 text-white flex flex-col py-8 shadow-2xl transition-all duration-300 ease-in-out
        ${open ? 'w-64 px-4' : 'w-20 px-2'}
        md:translate-x-0 md:opacity-100 md:pointer-events-auto`
      }
      style={{ transition: 'width 0.3s, padding 0.3s' }}
    >
      {/* Top row: logo, title, close/open button */}
      {/* Absolute close/open button at top-right */}
      {open ? (
        <button
          className="absolute top-2 right-2 flex items-center justify-center w-10 h-10 rounded-full hover:bg-blue-700 focus:outline-none transition-all duration-200 z-10"
          onClick={onClose}
          aria-label="Close sidebar"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      ) : (
        <div className="flex justify-center w-full absolute top-2 left-0">
          <button
            className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-blue-700 focus:outline-none transition-all duration-200 z-10"
            onClick={() => onClose(false)}
            aria-label="Open sidebar"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      )}
      {/* Logo and 2-line text row below the close button */}
      <div className="relative flex items-center w-full min-w-0 mt-10 mb-10 px-2 gap-3" style={{height: '40px'}}>
        <div className={`flex items-center w-full ${open ? '' : 'justify-center'}`}> 
          <img src="/images/logo.svg" alt="Logo" className="w-10 h-10 flex-shrink-0" />
          <div className={`flex flex-col justify-center h-10 min-w-0 transition-all duration-300 overflow-hidden ${open ? 'max-w-[110px] ml-2 opacity-100' : 'max-w-0 ml-0 opacity-0'}`}>
            <span className="block text-sm font-bold leading-tight text-white truncate" style={{lineHeight:'1.1', maxHeight:'18px'}}>Monthly</span>
            <span className="block text-sm font-bold leading-tight text-white truncate" style={{lineHeight:'1.1', maxHeight:'18px'}}>Consumption</span>
          </div>
        </div>
      </div>
        <nav className="flex flex-col gap-2">
          {/* Home */}
          <NavLink
            to={`/${role}/home`}
            className={({ isActive }) => `flex items-center gap-3 text-left px-4 py-2 rounded transition-colors ${isActive ? 'bg-blue-800' : 'hover:bg-blue-700'} ${open ? '' : 'justify-center items-center'}`}
            title="Home"
          >
            <img src="/images/home.svg" alt="Home" className="h-6 w-6" />
            <span className={`text-sm whitespace-nowrap overflow-hidden transition-all duration-300 ${open ? 'max-w-[120px] ml-2 opacity-100' : 'max-w-0 ml-0 opacity-0'}`}>Home</span>
          </NavLink>
          {/* Dashboard Dropdown for PMO */}
          {role === 'pmo' && (
              <>
                <div className="relative">
                  <button
                    className={`flex items-center gap-3 text-left px-4 py-2 rounded transition-colors w-full ${
                      dashboardOpen
                        ? 'bg-blue-800' 
                        : 'hover:bg-blue-700'
                    } ${open ? '' : 'justify-center items-center'}`}
                    title="Dashboard"
                    style={{ justifyContent: open ? 'flex-start' : 'center' }}
                    type="button"
                    onClick={() => setDashboardOpen((open) => !open)}
                    aria-expanded={dashboardOpen}
                    aria-controls="dashboard-dropdown"
                  >
                    <img src="/images/dashboard.svg" alt="Dashboard" className="h-6 w-6" />
                    <span className={`text-sm whitespace-nowrap overflow-hidden transition-all duration-300 ${open ? 'max-w-[120px] ml-2 opacity-100' : 'max-w-0 ml-0 opacity-0'}`}>Dashboard</span>
                    <svg 
                      className={`ml-auto transition-transform duration-300 ease-in-out ${
                        dashboardOpen ? 'rotate-180' : ''
                      } ${open ? '' : 'hidden'}`} 
                      width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"
                    >
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </button>
                  {/* Dropdown container - always render but control visibility with height/opacity */}
                  <div 
                    id="dashboard-dropdown"
                    className={`ml-8 overflow-hidden transition-all duration-300 ease-in-out ${
                      dashboardOpen 
                        ? 'max-h-[120px] opacity-100 mt-1' 
                        : 'max-h-0 opacity-0 mt-0'
                    }`}
                  >
                    {/* Dropdown content */}
                    <div className="flex flex-col gap-1 bg-blue-900 rounded shadow-lg z-20">
                      <NavLink
                        to={`/${role}/fuel-consumption`}
                        className={({ isActive }) => `flex items-center gap-3 px-4 py-2 rounded transition-all duration-200 text-left ${isActive ? 'bg-blue-600 text-white' : 'hover:bg-blue-600 text-blue-100'}`}
                      >
                        <span>Fuel Consumption</span>
                      </NavLink>
                      <NavLink
                        to={`/${role}/electricity-consumption`}
                        className={({ isActive }) => `flex items-center gap-3 px-4 py-2 rounded transition-all duration-200 text-left ${isActive ? 'bg-blue-600 text-white' : 'hover:bg-blue-600 text-blue-100'}`}
                      >
                        <span>Electricity Consumption</span>
                      </NavLink>
                    </div>
                  </div>
                </div>
              {/* Item Inventory (pmo only, below dashboard dropdown) */}
              <NavLink
                 to={`/${role}/item-inventory`}
                 className={({ isActive }) => `flex items-center gap-3 text-left px-4 py-2 rounded transition-colors ${isActive ? 'bg-blue-800' : 'hover:bg-blue-700'} ${open ? '' : 'justify-center items-center'}`}
                 title="Item Inventory"
               >
                 <img src="/images/item-inventory.svg" alt="Item Inventory" className="h-6 w-6" />
                 <span className={`text-sm whitespace-nowrap overflow-hidden transition-all duration-300 ${open ? 'max-w-[120px] ml-2 opacity-100' : 'max-w-0 ml-0 opacity-0'}`}>Item Inventory</span>
               </NavLink>
             </>
           )}

        {/* Admin Management (superadmin only) */}
          {role === 'superadmin' && (
             <>
               <NavLink
                 to="/superadmin/admin-management"
                 className={({ isActive }) => `flex items-center gap-3 text-left px-4 py-2 rounded transition-colors ${isActive ? 'bg-blue-800' : 'hover:bg-blue-700'} ${open ? '' : 'justify-center items-center'}`}
                 title="Admin Management"
               >
                 <img src="/images/admin-management.svg" alt="Admin Management" className="h-6 w-6" />
                 <span className={`text-sm whitespace-nowrap overflow-hidden transition-all duration-300 ${open ? 'max-w-[120px] ml-2 opacity-100' : 'max-w-0 ml-0 opacity-0'}`}>Admin Management</span>
               </NavLink>
               <NavLink
                 to="/superadmin/user-management"
                 className={({ isActive }) => `flex items-center gap-3 text-left px-4 py-2 rounded transition-colors ${isActive ? 'bg-blue-800' : 'hover:bg-blue-700'} ${open ? '' : 'justify-center items-center'}`}
                 title="PMO Management"
               >
                 <img src="/images/user-management.svg" alt="PMO Management" className="h-6 w-6" />
                 <span className={`text-sm whitespace-nowrap overflow-hidden transition-all duration-300 ${open ? 'max-w-[120px] ml-2 opacity-100' : 'max-w-0 ml-0 opacity-0'}`}>PMO Management</span>
               </NavLink>
             </>
           )}
          {/* User Management (admin only) */}
          {role === 'admin' && (
             <NavLink
               to="/admin/user-management"
               className={({ isActive }) => `flex items-center gap-3 text-left px-4 py-2 rounded transition-colors ${isActive ? 'bg-blue-800' : 'hover:bg-blue-700'} ${open ? '' : 'justify-center items-center'}`}
               title="PMO Management"
             >
               <img src="/images/user-management.svg" alt="PMO Management" className="h-6 w-6" />
               <span className={`text-sm whitespace-nowrap overflow-hidden transition-all duration-300 ${open ? 'max-w-[120px] ml-2 opacity-100' : 'max-w-0 ml-0 opacity-0'}`}>PMO Management</span>
             </NavLink>
           )}
        </nav>
        {/* Profile button above logout at the very bottom */}
        <div className="mt-auto flex flex-col gap-3 pt-8">
          <NavLink
              to={`/${role}/profile`}
              className={({ isActive }) => `flex items-center gap-3 w-full text-left px-4 py-2 rounded transition-colors ${isActive ? 'bg-blue-800' : 'hover:bg-blue-700'} ${open ? '' : 'justify-center items-center'}`}
              title="Profile"
            >
              <img src="/images/profile.svg" alt="Profile" className="h-6 w-6" />
              <span className={`text-sm whitespace-nowrap overflow-hidden transition-all duration-300 ${open ? 'max-w-[120px] ml-2 opacity-100' : 'max-w-0 ml-0 opacity-0'}`}>Profile</span>
            </NavLink>
          {onLogout && (
            <button
              className={`flex items-center gap-3 w-full text-left px-4 py-2 rounded transition-colors font-semibold hover:bg-red-700 ${open ? '' : 'justify-center items-center'}`}
              onClick={onLogout}
              title="Logout"
            >
              <img src="/images/logout.svg" alt="Logout" className="h-6 w-6" />
              <span className={`text-sm whitespace-nowrap overflow-hidden transition-all duration-300 ${open ? 'max-w-[120px] ml-2 opacity-100' : 'max-w-0 ml-0 opacity-0'}`}>Logout</span>
            </button>
          )}
        </div>
      </aside>
  );
}
