import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Login from './Login.jsx';
// import Signup from './Signup.jsx';
import Sidebar from './components/Sidebar';
import ConsumptionItemsSection from './components/ConsumptionItemsSection';
import ArchivedItemsSection from './components/ArchivedItemsSection';
import AccountList from './components/AccountList';

import Header from './components/Header';
import FuelConsumption from './FuelConsumption';
import ElectricityConsumption from './ElectricityConsumption';
import Settings from './components/Settings/Settings';
import SettingsProfile from './components/Settings/SettingsProfile';
import SettingsOffice from './components/Settings/SettingsOffice';

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


function DashboardContent({ role, onOpenCreateUser, onCardClick, view }) {
  // Only show cards for PMO home dashboard
  if (role === 'pmo' && view === 'home') {
    return (
      <div className="flex flex-col md:flex-row gap-6 justify-center items-center mt-12">
        {/* Fuel Consumption Card */}
        <a
          href="/pmo/fuel-consumption"
          className="bg-white rounded-xl shadow-lg p-8 w-72 flex flex-col items-center hover:shadow-2xl hover:bg-blue-50 transition-all border border-blue-100 hover:border-blue-400 group"
        >
          <img src="/images/fuel.svg" alt="Fuel Consumption" className="h-16 w-16 mb-4 group-hover:scale-105 transition-transform" />
          <span className="text-lg font-bold text-blue-900 mb-2">Fuel Consumption</span>
          <span className="text-gray-500 text-sm text-center">View and manage monthly fuel consumption records.</span>
        </a>
        {/* Electricity Consumption Card */}
        <a
          href="/pmo/electricity-consumption"
          className="bg-white rounded-xl shadow-lg p-8 w-72 flex flex-col items-center hover:shadow-2xl hover:bg-blue-50 transition-all border border-blue-100 hover:border-blue-400 group"
        >
          <img src="/images/electricity.svg" alt="Electricity Consumption" className="h-16 w-16 mb-4 group-hover:scale-105 transition-transform" />
          <span className="text-lg font-bold text-blue-900 mb-2">Electricity Consumption</span>
          <span className="text-gray-500 text-sm text-center">View and manage monthly electricity consumption records.</span>
        </a>
      </div>
    );
  }
  // Placeholder for other roles/views
  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] text-gray-400">
      <span>No dashboard content available.</span>
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
  const [profileOpen, setProfileOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768); // md breakpoint
  const navigate = useNavigate();
  const location = useLocation();

  // Responsive sidebar toggle
  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setSidebarOpen(true);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Track last non-settings route for settings back button
  React.useEffect(() => {
    if (!location.pathname.includes('/settings')) {
      sessionStorage.setItem('last_non_settings_path', location.pathname);
    }
  }, [location.pathname]);

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
    // Always navigate to the correct home page after login
    if (userRole === 'superadmin') {
      navigate('/superadmin/home', { replace: true });
    } else if (userRole === 'admin') {
      navigate('/admin/home', { replace: true });
    } else if (userRole === 'pmo') {
      navigate('/pmo/home', { replace: true });
    } else {
      navigate('/', { replace: true });
    }
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
    navigate('/login');
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
    // Hide Sidebar and Header on settings routes
    const isSettingsRoute = location.pathname.startsWith('/pmo/settings');
    return (
      <div className="flex h-screen">
        {!isSettingsRoute && (
          <Sidebar
            role={role}
            fullName={fullName}
            open={sidebarOpen}
            onClose={() => setSidebarOpen(!sidebarOpen)}
            onLogout={handleLogout}
          />
        )}
        <div className="flex-1 flex flex-col min-w-0">
          {!isSettingsRoute && (
            <Header
              fullName={fullName}
              email={email}
              role={role}
              onProfile={() => setProfileOpen(true)}
              onSidebarToggle={() => setSidebarOpen((v) => !v)}
            />
          )}
          {/* Profile modal always available and controlled by state */}
          {!isSettingsRoute && (
            <ProfileModal 
              user={{ email, firstName, lastName, role }}
              open={profileOpen}
              onClose={() => setProfileOpen(false)}
            />
          )}
          <main className="flex-1 overflow-y-auto bg-gray-100 px-2 md:px-6 py-4">
            <Routes>
                <Route path="/" element={token ? <Navigate to={`/${role}/home`} /> : <Login onLogin={handleSwitchView} />} />
                <Route path="/login" element={<Login onLogin={handleSwitchView} />} />
                {/* PMO Routes */}
                <Route path="/pmo/home" element={<DashboardContent role="pmo" view="home" />} />
                <Route path="/pmo/fuel-consumption" element={<FuelConsumption />} />
                <Route path="/pmo/electricity-consumption" element={<ElectricityConsumption />} />
                <Route path="/pmo/item-inventory" element={<ConsumptionItemsSection token={token} />} />
<Route path="/pmo/archived-items" element={<ArchivedItemsSection token={token} />} />
                <Route path="/pmo/settings" element={<Settings />}>
                  <Route index element={<Navigate to="profile" replace />} />
                  <Route path="profile" element={<SettingsProfile />} />
                  <Route path="office" element={<SettingsOffice />} />
                </Route>
                {/* Admin Routes */}
                <Route path="/admin/home" element={<DashboardContent role="admin" view="home" />} />
                <Route path="/admin/item-inventory" element={<ConsumptionItemsSection token={token} />} />
                <Route path="/admin/user-management" element={<AccountList role="pmo" />} />
                {/* Superadmin Routes */}
                <Route path="/superadmin/home" element={<DashboardContent role="superadmin" view="home" />} />
                <Route path="/superadmin/admin-management" element={<AccountList role="admin" />} />
                <Route path="/superadmin/user-management" element={<AccountList role="pmo" />} />
                {/* Fallback */}
                <Route path="*" element={<Navigate to={token && role ? location.pathname : '/login'} />} />
              </Routes>
            </main>
          </div>
        </div>
    );
  }
  // Not logged in: show login screen
  return <Login onLogin={handleSwitchView} />;
}

// Duplicate AppShell removed. Only one AppShell should exist in this file.

function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AppShell />
    </BrowserRouter>
  );
}

export default App;
