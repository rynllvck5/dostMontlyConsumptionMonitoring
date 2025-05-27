import React, { useState } from 'react';
import Login from './Login.jsx';
// import Signup from './Signup.jsx';
import Sidebar from './components/Sidebar';
import Header from './components/Header';

// Chevron button for mini-sidebar (right)
const MiniSidebarButton = ({ onClick }) => (
  <button
    className="flex items-center justify-center w-full h-12 mt-2 focus:outline-none transition-all duration-150 active:scale-90"
    aria-label="Open sidebar"
    onClick={onClick}
  >
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  </button>
);
// Chevron button for closing sidebar (left)
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

import ProfileModal from './components/ProfileModal';
import CreateUserModal from './components/CreateUserModal';
import AccountList from './components/AccountList';


function DashboardContent({ role, onOpenCreateUser }) {
  const displayRole = role ? role.charAt(0).toUpperCase() + role.slice(1) : 'User';
  return (
    <div>
      <h2>Welcome, {displayRole}</h2>
      {role === 'superadmin' && (
        <div className="my-4">
          <b>Superadmin Panel:</b> Manage all users and admins here.
          <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold transition-colors" onClick={() => onOpenCreateUser('superadmin')}>
            Create Admin/User
          </button>
        </div>
      )}
      {role === 'admin' && (
        <div className="my-4">
          <b>Admin Panel:</b> Manage regular users here.
          <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold transition-colors" onClick={() => onOpenCreateUser('admin')}>
            Create User
          </button>
        </div>
      )}
      {role === 'user' && (
        <div>
          <b>User Dashboard:</b> View your profile and data here.
        </div>
      )}
      {!role && (
        <div>
          <span>General Dashboard</span>
          <p>Welcome to your dashboard. Please log in to see more details.</p>
        </div>
      )}
    </div>
  );
}

function App() {
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [createUserType, setCreateUserType] = useState(null);
  const [view, setView] = useState('login');
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [role, setRole] = useState(localStorage.getItem('role') || null);
  const [username, setUsername] = useState(localStorage.getItem('username') || '');
  const [userId, setUserId] = useState(localStorage.getItem('userId') || '');
  const [nav, setNav] = useState('dashboard');
  const [profileOpen, setProfileOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768); // md breakpoint

  // Responsive sidebar toggle
  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setSidebarOpen(true);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Check token validity on load
  React.useEffect(() => {
    const checkToken = async () => {
      if (token) {
        try {
          // Import and use the validateToken utility
          const { validateToken, showSessionExpiredModal } = await import('./utils/auth.jsx');
          const isValid = await validateToken();
          if (!isValid) {
            // Token is invalid or expired - show modal
            showSessionExpiredModal();
          }
        } catch (err) {
          console.error('Error checking token:', err);
        }
      }
    };
    checkToken();
  }, [token]);

  // Handler for switching views from login
  const handleSwitchView = (jwt, userRole) => {
    if (jwt && userRole) {
      handleLogin(jwt, userRole);
    }
  };

  const handleLogin = (jwt, userRole) => {
    setToken(jwt);
    setRole(userRole);
    // For demo, let's just use the last logged in username
    const uname = window.sessionStorage.getItem('lastLoginUser') || '';
    setUsername(uname);
    
    // Get user ID from JWT token
    try {
      const tokenData = JSON.parse(atob(jwt.split('.')[1]));
      if (tokenData && tokenData.id) {
        setUserId(tokenData.id);
        localStorage.setItem('userId', tokenData.id);
      }
    } catch (e) {
      console.error('Failed to parse JWT token', e);
    }
    
    localStorage.setItem('token', jwt);
    localStorage.setItem('role', userRole);
    localStorage.setItem('username', uname);
  };
  const handleLogout = () => {
    setToken(null);
    setRole(null);
    setUsername('');
    setUserId('');
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('username');
    localStorage.removeItem('userId');
    setView('login');
  };

  // Save username on login form submit
  const handleLoginUsername = (uname) => {
    window.sessionStorage.setItem('lastLoginUser', uname);
  };

  if (token && role) {
    return (
      <div className="flex h-screen bg-gray-100 relative">
        {/* Mini-sidebar: always visible when sidebar is closed */}
        {/* Animated mini-sidebar: fade/slide in/out */}
        {/* Morphing sidebar: animates width, content changes based on open state */}
        <div
          className={`fixed md:sticky left-0 top-0 z-50 h-full bg-gradient-to-b from-blue-900 to-blue-800 text-white flex flex-col shadow-2xl transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-12'} overflow-hidden`}
        >
          {/* Sidebar content morphs */}
          {sidebarOpen ? (
            <>
              <SidebarCloseButton onClick={() => setSidebarOpen(false)} />
              <div className="flex items-center gap-2 mb-10 px-2 mt-2">
                <img src="/images/logo.png" alt="Logo" className="w-10 h-10" />
                <h2 className="text-2xl font-bold tracking-wide">Monthly Consumption</h2>
              </div>
              <nav className="flex flex-col gap-2">
                <button
                  className={`text-left px-4 py-2 rounded transition-colors ${nav === 'dashboard' ? 'bg-blue-800' : 'hover:bg-blue-700'}`}
                  onClick={() => setNav('dashboard')}
                >
                  Home
                </button>
                <button
                  className={`text-left px-4 py-2 rounded transition-colors ${nav === 'profile' ? 'bg-blue-800' : 'hover:bg-blue-700'}`}
                  onClick={() => setNav('profile')}
                >
                  Profile
                </button>
                {role === 'superadmin' && (
                  <>
                    <button className={`text-left px-4 py-2 rounded transition-colors ${nav === 'admin-management' ? 'bg-blue-800' : 'hover:bg-blue-700'}`}
                      onClick={() => setNav('admin-management')}
                    >
                      Admin Management
                    </button>
                    <button className={`text-left px-4 py-2 rounded transition-colors ${nav === 'user-management' ? 'bg-blue-800' : 'hover:bg-blue-700'}`}
                      onClick={() => setNav('user-management')}
                    >
                      User Management
                    </button>
                  </>
                )}
                {role === 'admin' && (
                  <button className={`text-left px-4 py-2 rounded transition-colors ${nav === 'user-management' ? 'bg-blue-800' : 'hover:bg-blue-700'}`}
                    onClick={() => setNav('user-management')}
                  >
                    User Management
                  </button>
                )}
              </nav>
            </>
          ) : (
            <MiniSidebarButton onClick={() => setSidebarOpen(true)} />
          )}
        </div>
        <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300`}>
          <Header
            username={username}
            role={role}
            onProfileClick={() => {
              setNav('profile');
              setProfileOpen(true);
            }}
            onLogout={handleLogout}
          />
          <main className="flex-1 overflow-auto">
            {nav === 'dashboard' && <DashboardContent role={role} />}
            {nav === 'profile' && (
              <ProfileModal
                user={{ username, role, id: userId }}
                open={profileOpen}
                onClose={() => setProfileOpen(false)}
              />
            )}
            {nav === 'admin-management' && role === 'superadmin' && (
              <div className="p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                  <h2 className="text-2xl font-bold">Admin Management</h2>
                  <button 
                    className="mt-4 md:mt-0 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors flex items-center justify-center"
                    onClick={() => { setCreateUserType('admin'); setCreateUserOpen(true); }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Create Admin
                  </button>
                </div>
                <div>
                  <AccountList 
                    role="admin" 
                    token={token} 
                    onCreateClick={() => { setCreateUserType('admin'); setCreateUserOpen(true); }} 
                  />
                </div>
              </div>
            )}
            {nav === 'user-management' && (role === 'admin' || role === 'superadmin') && (
              <div className="p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                  <h2 className="text-2xl font-bold">User Management</h2>
                  <button 
                    className="mt-4 md:mt-0 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors flex items-center justify-center"
                    onClick={() => { setCreateUserType('user'); setCreateUserOpen(true); }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Create User
                  </button>
                </div>
                <div>
                  <AccountList 
                    role="user" 
                    token={token} 
                    onCreateClick={() => { setCreateUserType('user'); setCreateUserOpen(true); }}
                  />
                </div>
              </div>
            )}
          </main>
        </div>
        <CreateUserModal
          open={createUserOpen}
          onClose={() => setCreateUserOpen(false)}
          isSuperadmin={createUserType === 'superadmin'}
          role={createUserType} 
          onCreate={async ({ username, password }) => {
            const { createUser, checkUsernameExists } = await import('./api');
            const token = localStorage.getItem('token');
            if (!token) return { success: false, message: 'Not authenticated.' };
            // Check if username exists for this role
            const check = await checkUsernameExists(username, createUserType);
            if (check.exists) {
              return { success: false, message: `Username '${username}' already exists.` };
            }
            const result = await createUser({ username, password, role: createUserType, token });
            return result;
          }}
        />
      </div>
    );
  }

  if (view === 'login') {
    return <Login onLogin={handleSwitchView} />;
  }
  // No other views supported now
  return null;
}

export default App;
