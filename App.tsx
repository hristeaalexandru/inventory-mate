import React, { useState } from 'react';
import { Project } from './types';
import Dashboard from './components/Dashboard';
import ProjectView from './components/ProjectView';

const App: React.FC = () => {
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

  const handleNavigateToProject = (projectId: string) => {
    setActiveProjectId(projectId);
  };

  const handleNavigateToDashboard = () => {
    setActiveProjectId(null);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      {activeProjectId ? (
        <ProjectView 
          projectId={activeProjectId} 
          onBack={handleNavigateToDashboard} 
        />
      ) : (
        <Dashboard onSelectProject={handleNavigateToProject} />
      )}
    </div>
  );
};

export default App;