import React from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import SettingsSidebar from './SettingsSidebar';
import SettingsProfile from './SettingsProfile';
import SettingsOffice from './SettingsOffice';

import { useLocation } from 'react-router-dom';

export default function Settings() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="flex min-h-screen bg-gray-100">
      <SettingsSidebar />
      <main className="flex-1 ml-56 px-5 py-5"> <section className="bg-white rounded-xl shadow-md p-8 max-w-7.5xl min-h-[350px]">
          {/* Section title can be dynamic if desired, e.g. Profile or Office */}
          <Outlet />
        </section>
      </main>
    </div>
  );
}
