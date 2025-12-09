import React, { useState, useEffect } from 'react';
import { Project } from '../types';
import * as StorageService from '../services/storageService';
import { Plus, Trash2, FolderOpen, Calendar, Box, AlertCircle } from 'lucide-react';

interface DashboardProps {
  onSelectProject: (projectId: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onSelectProject }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');

  // State pentru gestionarea confirmării ștergerii pe fiecare card
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    loadProjects();
  }, []);

  // Dacă utilizatorul nu confirmă ștergerea în 3 secunde, resetăm butonul
  useEffect(() => {
    if (deleteConfirmId) {
      const timer = setTimeout(() => {
        setDeleteConfirmId(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [deleteConfirmId]);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const data = await StorageService.getProjects();
      const sorted = data.sort((a, b) => 
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
      setProjects(sorted);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    await StorageService.createProject(newProjectName, newProjectDesc);
    setNewProjectName('');
    setNewProjectDesc('');
    setShowNewProjectModal(false);
    loadProjects();
  };

  const handleDeleteClick = async (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation(); // Oprește deschiderea proiectului

    if (deleteConfirmId === projectId) {
      // Pasul 2: Confirmare primită -> Șterge
      await StorageService.deleteProject(projectId);
      setDeleteConfirmId(null);
      // Reîncărcăm lista pentru a fi siguri
      await loadProjects();
    } else {
      // Pasul 1: Solicită confirmare
      setDeleteConfirmId(projectId);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Proiecte Inventar</h1>
          <p className="text-gray-400">Gestionează inventarele scriptice și faptice.</p>
        </div>
        <button 
          onClick={() => setShowNewProjectModal(true)}
          className="flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-lg shadow-blue-900/20 transition-all transform hover:scale-105"
        >
          <Plus size={20} className="mr-2" />
          Proiect Nou
        </button>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="text-center py-20 text-gray-500">Se încarcă proiectele...</div>
      ) : projects.length === 0 ? (
        <div className="text-center py-20 bg-gray-800/50 rounded-2xl border-2 border-dashed border-gray-700">
          <FolderOpen size={48} className="mx-auto text-gray-600 mb-4" />
          <h3 className="text-xl font-medium text-gray-300">Nu există proiecte</h3>
          <p className="text-gray-500 mt-2">Creează un proiect nou pentru a începe inventarul.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div 
              key={project.id}
              onClick={() => onSelectProject(project.id)}
              className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 flex flex-col overflow-hidden hover:border-blue-500/50 transition-all group cursor-pointer"
            >
              {/* Card Body */}
              <div className="p-6 flex-1">
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-3 rounded-lg ${project.isLocked ? 'bg-green-900/20 text-green-400' : 'bg-blue-900/20 text-blue-400'}`}>
                    <Box size={24} />
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full border ${project.isLocked ? 'border-green-800 text-green-400 bg-green-900/10' : 'border-blue-800 text-blue-400 bg-blue-900/10'}`}>
                    {project.isLocked ? 'Activ' : 'Configurare'}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-white mb-2 truncate" title={project.name}>{project.name}</h3>
                <p className="text-gray-400 text-sm mb-4 line-clamp-2 min-h-[40px]">
                  {project.description || 'Fără descriere...'}
                </p>

                <div className="flex items-center text-xs text-gray-500 mt-auto">
                  <Calendar size={14} className="mr-1" />
                  <span>Actualizat: {new Date(project.updatedAt).toLocaleDateString('ro-RO')}</span>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="bg-gray-900/50 p-3 border-t border-gray-700 flex justify-end" onClick={(e) => e.stopPropagation()}>
                  <button 
                    onClick={(e) => handleDeleteClick(e, project.id)}
                    className={`flex items-center text-xs font-bold px-4 py-2 rounded transition-all duration-200 ${
                      deleteConfirmId === project.id 
                        ? 'bg-red-600 text-white shadow-lg hover:bg-red-700 w-full justify-center' 
                        : 'text-red-400 hover:text-red-300 hover:bg-red-900/20'
                    }`}
                  >
                    {deleteConfirmId === project.id ? (
                      <>
                        <AlertCircle size={16} className="mr-2" />
                        Sigur? Apasă pentru confirmare
                      </>
                    ) : (
                      <>
                        <Trash2 size={16} className="mr-1.5" />
                        Șterge
                      </>
                    )}
                  </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Project Modal */}
      {showNewProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md border border-gray-700 overflow-hidden">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-white mb-6">Proiect Nou</h2>
              <form onSubmit={handleCreateProject}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-400 mb-1">Nume Proiect</label>
                  <input
                    type="text"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    placeholder="ex: Inventar Magazin 2024"
                    autoFocus
                  />
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-400 mb-1">Descriere (Opțional)</label>
                  <textarea
                    value={newProjectDesc}
                    onChange={(e) => setNewProjectDesc(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none h-24"
                    placeholder="Detalii despre locație sau gestiune..."
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowNewProjectModal(false)}
                    className="px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    Anulează
                  </button>
                  <button
                    type="submit"
                    disabled={!newProjectName.trim()}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Creează
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;