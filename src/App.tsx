import React from 'react';
import { AppProvider, useApp } from './contexts/AppContext';
import { Layout } from './components/Layout';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { AttendanceScanner } from './components/AttendanceScanner';
import { StudentsManagement } from './components/StudentsManagement';
import { ClassesManagement } from './components/ClassesManagement';
import { TeachersManagement } from './components/TeachersManagement';
import { SessionsManagement } from './components/SessionsManagement';
import { ReportsManagement } from './components/ReportsManagement';
import { WhatsAppManagement } from './components/WhatsAppManagement';
import { UsersManagement } from './components/UsersManagement';
import { SettingsManagement } from './components/SettingsManagement';

function AppContent() {
  const { currentUser, currentPage } = useApp();
  

  if (!currentUser) {
    return <Login />;
  }

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'attendance-scanner':
        return <AttendanceScanner />;
      case 'students':
        return <StudentsManagement />;
      case 'classes':
        return <ClassesManagement />;
      case 'teachers':
        return <TeachersManagement />;
      case 'sessions':
        return <SessionsManagement />;
      case 'reports':
        return <ReportsManagement />;
      case 'whatsapp':
        return <WhatsAppManagement />;
      case 'settings':
        return <SettingsManagement />;
      case 'users':
        return currentUser.role === 'admin' ? <UsersManagement /> : <Dashboard />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout>
      {renderCurrentPage()}
    </Layout>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;