import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Login from './Login.jsx';
// import Signup from './Signup.jsx';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import FuelConsumption from './FuelConsumption';
import ElectricityConsumption from './ElectricityConsumption';
import ConsumptionItemsSection from "./components/ConsumptionItemsSection";

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


function DashboardContent({ role, onOpenCreateUser, onCardClick, view }) {
  const displayRole = role ? role.charAt(0).toUpperCase() + role.slice(1) : 'User';
  return (
    <div>
      {view === 'home' && (
        <>
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
              <b>Admin Panel:</b> Manage users here.
            </div>
          )}
          {!role && (
            <div>
              <span>General Dashboard</span>
              <p>Welcome to your dashboard. Please log in to see more details.</p>
            </div>
          )}
        </>
      )}
      {role === 'user' && (
        <div className="flex flex-col items-center justify-center min-h-[50vh] w-full">
          <div className="flex flex-col md:flex-row gap-8 w-full max-w-2xl justify-center items-center">
            {/* Fuel Consumption Card */}
            <button
              className="bg-blue-100 shadow-lg rounded-xl p-8 flex-1 min-w-[260px] max-w-xs h-48 flex flex-col justify-start relative hover:shadow-xl hover:scale-105 transition-transform"
              style={{ cursor: 'pointer' }}
              onClick={() => onCardClick && onCardClick('fuel-consumption')}
            >
              <span className="text-lg font-semibold text-blue-900 absolute top-6 left-8">Fuel Consumption</span>
            </button>
            {/* Electricity Consumption Card */}
            <button
              className="bg-yellow-100 shadow-lg rounded-xl p-8 flex-1 min-w-[260px] max-w-xs h-48 flex flex-col justify-start relative hover:shadow-xl hover:scale-105 transition-transform"
              style={{ cursor: 'pointer' }}
              onClick={() => onCardClick && onCardClick('electricity-consumption')}
            >
              <span className="text-lg font-semibold text-yellow-900 absolute top-6 left-8">Electricity Consumption</span>
            </button>
          </div>
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

function AppShell() {
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [createUserType, setCreateUserType] = useState(null);
  const [view, setView] = useState('login');
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [role, setRole] = useState(localStorage.getItem('role') || null);
  const [email, setEmail] = useState(localStorage.getItem('email') || '');
  const [firstName, setFirstName] = useState(localStorage.getItem('firstName') || '');
  const [lastName, setLastName] = useState(localStorage.getItem('lastName') || '');
  const [userId, setUserId] = useState(localStorage.getItem('userId') || '');
  const [nav, setNav] = useState('dashboard');
  const [profileOpen, setProfileOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768); // md breakpoint
  const navigate = useNavigate();
  const location = useLocation();

  // Set the correct navigation state based on the current URL path
  React.useEffect(() => {
    const path = location.pathname;
    if (path === '/') {
      setNav('dashboard');
    } else if (path === '/fuel-consumption') {
      // For consumption pages, show both the dropdown and the selected item
      if (role === 'user') {
        // Set a special combined state for dropdown + selection
        setNav('dropdown-fuel-consumption');
      } else {
        setNav('fuel-consumption');
      }
    } else if (path === '/electricity-consumption') {
      if (role === 'user') {
        // Set a special combined state for dropdown + selection
        setNav('dropdown-electricity-consumption');
      } else {
        setNav('electricity-consumption');
      }
    } else if (path === '/electricity-consumption-main') {
      setNav('electricity-consumption');
    }
  }, [location, role]);

  // Navigation handler for sidebar and cards
  const handleNav = (navKey) => {
    // Set navigation state based on selected item
    if (navKey === 'dashboard-dropdown') {
      // Toggle dropdown when clicked
      if (nav === 'dashboard-dropdown') {
        setNav('');
      } else if (nav === 'dropdown-fuel-consumption') {
        setNav('fuel-consumption');
      } else if (nav === 'dropdown-electricity-consumption') {
        setNav('electricity-consumption');
      } else {
        setNav('dashboard-dropdown');
      }
      return; // Don't navigate
    } else if (navKey === 'fuel-consumption') {
      // For consumption items, we need to maintain dropdown state
      setNav('dropdown-fuel-consumption');
      navigate('/fuel-consumption');
    } else if (navKey === 'electricity-consumption') {
      // For consumption items, we need to maintain dropdown state
      setNav('dropdown-electricity-consumption');
      navigate('/electricity-consumption');
    } else if (navKey === 'dashboard') {
      setNav(navKey);
      navigate('/');
    } else if (navKey === 'electricity-consumption-main') {
      setNav(navKey);
      navigate('/electricity-consumption');
    } else if (navKey === 'item-inventory') {
      setNav('item-inventory');
      navigate('/item-inventory');
    } else {
      // For other navigation items, close any open dropdown
      setNav(navKey);
    }
  };

  // ... (rest of the logic is unchanged)

  
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

  const handleLogin = async (jwt, userRole) => {
    setToken(jwt);
    setRole(userRole);
    // For demo, let's just use the last logged in username
    const uname = window.sessionStorage.getItem('lastLoginUser') || '';
    setEmail(uname);

    // Fetch firstName and lastName from backend
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/auth';
      const res = await fetch(`${API_URL}/profile`, {
        headers: { 'Authorization': `Bearer ${jwt}` }
      });
      if (res.ok) {
        const userData = await res.json();
        setFirstName(userData.first_name || '');
        setLastName(userData.last_name || '');
        localStorage.setItem('firstName', userData.first_name || '');
        localStorage.setItem('lastName', userData.last_name || '');
      }
    } catch (e) {
      setFirstName('');
      setLastName('');
    }
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
    localStorage.setItem('email', uname);
  };
  const handleLogout = () => {
    setToken(null);
    setRole(null);
    setEmail('');
    setFirstName('');
    setLastName('');
    setUserId('');
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('email');
    localStorage.removeItem('firstName');
    localStorage.removeItem('lastName');
    localStorage.removeItem('userId');
    setView('login');
  };

  // On mount: if token, fetch profile for first/last name
  React.useEffect(() => {
    const fetchProfile = async () => {
      if (token) {
        try {
          const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/auth';
          const res = await fetch(`${API_URL}/profile`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const userData = await res.json();
            setFirstName(userData.first_name || '');
            setLastName(userData.last_name || '');
            localStorage.setItem('firstName', userData.first_name || '');
            localStorage.setItem('lastName', userData.last_name || '');
          }
        } catch (e) {
          setFirstName('');
          setLastName('');
        }
      }
    };
    fetchProfile();
    // eslint-disable-next-line
  }, [token]);

  // Save email on login form submit
  const handleLoginEmail = (mail) => {
    window.sessionStorage.setItem('lastLoginUser', uname);
  };

  if (token && role) {
    // Compute full name for sidebar
    const fullName = (firstName || lastName) ? `${firstName} ${lastName}`.trim() : email;
    return (
      <div className="flex h-screen bg-gray-100 relative">
        {/* Only render a single Sidebar, which morphs between open and closed states */}
        <Sidebar
          role={role}
          fullName={fullName}
          onNav={handleNav}
          selected={nav}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(!sidebarOpen)}
          onLogout={handleLogout}
        />
        <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300`}>
          <Header
            email={email}
            firstName={firstName}
            lastName={lastName}
            role={role}
            onProfileClick={() => {
              setNav('profile');
              setProfileOpen(true);
            }}
            onLogout={handleLogout}
          />
          <main className="flex-1 overflow-auto">
            <Routes>
              <Route path="/" element={<DashboardContent role={role} onOpenCreateUser={setCreateUserOpen} onCardClick={handleNav} />} />
              <Route path="/fuel-consumption" element={<FuelConsumption />} />
              <Route path="/electricity-consumption" element={<ElectricityConsumption />} />
              <Route path="/item-inventory" element={<ConsumptionItemsSection token={token} />} />
            </Routes>

            {nav === 'profile' && (
              <ProfileModal
                user={{ email, role, id: userId }}
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
          onCreate={async (user) => {
            if (!user) return { success: false, message: 'No user data provided.' };
            const { email, password, first_name, last_name, profile_picture, office_unit } = user;
            const { createUser, checkEmailExists } = await import('./api');
            const token = localStorage.getItem('token');
            if (!token) return { success: false, message: 'Not authenticated.' };
            // Check if username exists for this role
            const check = await checkEmailExists(email, createUserType);
            if (check.exists) {
              return { success: false, message: `Email '${email}' already exists.` };
            }
            // Pass all required fields including office_unit to the API
            const result = await createUser({ email, password, role: createUserType, token, first_name, last_name, profile_picture, office_unit });
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

function App() {
  return (
    <Router>
      <AppShell />
    </Router>
  );
}

export default App;
