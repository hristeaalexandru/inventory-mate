import React, { useState, useEffect } from 'react';
import { Project } from '../types';
import * as StorageService from '../services/storageService';
import { Plus, Trash2, FolderOpen, Package } from 'lucide-react';

interface DashboardProps {
  onSelectProject: (id: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onSelectProject }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = () => {
    setProjects(StorageService.getProjects());
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    StorageService.createProject(newName, newDesc);
    setNewName('');
    setNewDesc('');
    setIsCreating(false);
    loadProjects();
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    // Critical: Stop propagation immediately to prevent navigation
    e.preventDefault();
    e.stopPropagation();
    
    // Confirm dialog
    if (window.confirm('Ești sigur că vrei să ștergi acest proiect? Această acțiune este ireversibilă.')) {
      StorageService.deleteProject(id);
      loadProjects(); // Reload from source of truth to ensure sync
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Inventory Mate</h1>
          <p className="text-gray-400 mt-1">Gestionează proiectele de inventariere</p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-all border border-blue-500"
        >
          <Plus size={20} />
          <span className="hidden md:inline">Proiect Nou</span>
        </button>
      </header>

      {isCreating && (
        <div className="mb-8 bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700 animate-fade-in">
          <h2 className="text-xl font-semibold mb-4 text-white">Creează Proiect Nou</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Nume Proiect</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none placeholder-gray-500"
                placeholder="ex: Depozit A - Octombrie 2023"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Descriere (Opțional)</label>
              <input
                type="text"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none placeholder-gray-500"
                placeholder="Scurtă descriere..."
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 text-gray-300 hover:bg-gray-700 rounded-lg transition-colors"
              >
                Anulează
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Salvează
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {projects.length === 0 && !isCreating ? (
          <div className="col-span-full text-center py-12 bg-gray-800 rounded-xl border border-dashed border-gray-700">
            <Package size={48} className="mx-auto text-gray-600 mb-4" />
            <p className="text-gray-400">Nu există proiecte. Creează unul pentru a începe.</p>
          </div>
        ) : (
          projects.map((project) => (
            <div
              key={project.id}
              className="group bg-gray-800 rounded-xl shadow-md border border-gray-700 hover:border-blue-500 transition-all relative overflow-hidden"
            >
                {/* Main Click Area */}
                <div 
                    onClick={() => onSelectProject(project.id)}
                    className="p-6 cursor-pointer h-full"
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className="pr-8"> {/* Padding right to avoid overlap with delete button */}
                            <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">
                                {project.name}
                            </h3>
                            <p className="text-sm text-gray-400 mt-1 line-clamp-2">{project.description || 'Fără descriere'}</p>
                        </div>
                    </div>
                  
                    <div className="flex items-center justify-between mt-4">
                        <div className="text-xs text-gray-500">
                        {new Date(project.updatedAt).toLocaleDateString()}
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full border ${project.isLocked ? 'bg-green-900/30 text-green-400 border-green-800' : 'bg-yellow-900/30 text-yellow-400 border-yellow-800'}`}>
                            {project.isLocked ? 'Activ' : 'Configurare'}
                        </span>
                    </div>
                </div>

                {/* Separate Delete Action Area - Positioned Absolutely */}
                <div className="absolute top-2 right-2 z-10">
                    <button
                        onClick={(e) => handleDelete(e, project.id)}
                        className="p-2 text-gray-500 hover:text-red-400 hover:bg-gray-700 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/50"
                        title="Șterge Proiect"
                        aria-label="Delete Project"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Dashboard;