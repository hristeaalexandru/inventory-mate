import React, { useState, useEffect, useRef } from 'react';
import { Project, InventoryItem } from '../types';
import * as StorageService from '../services/storageService';
import { ArrowLeft, Upload, Download, CheckCircle, AlertTriangle, Search, Barcode } from 'lucide-react';

interface ProjectViewProps {
  projectId: string;
  onBack: () => void;
}

const ProjectView: React.FC<ProjectViewProps> = ({ projectId, onBack }) => {
  const [project, setProject] = useState<Project | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const manualInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadProject();
  }, [projectId]);

  // Focus manual input on load for handheld scanners
  useEffect(() => {
    if (project?.isLocked) {
        manualInputRef.current?.focus();
    }
  }, [project?.isLocked]);

  const loadProject = async () => {
    setLoading(true);
    const data = await StorageService.getProjectById(projectId);
    setProject(data);
    setLoading(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      // Simple CSV Parser: Assumes Header Row, then Name, Code, Qty
      const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== '');
      // Skip header
      const dataLines = lines.slice(1);
      
      const items: InventoryItem[] = dataLines.map(line => {
        const parts = line.split(',');
        return {
          name: parts[0]?.trim() || 'Necunoscut',
          code: parts[1]?.trim() || 'Necunoscut',
          scripticQty: parseInt(parts[2]?.trim() || '0', 10),
          actualQty: 0
        };
      }).filter(item => item.code !== 'Necunoscut');

      await StorageService.updateProjectItems(projectId, items);
      loadProject();
    };
    reader.readAsText(file);
  };

  const handleExport = () => {
    if (!project) return;
    const header = "Denumire,Cod,Scriptic,Faptic,Diferenta\n";
    const rows = project.items.map(item => 
      `"${item.name}","${item.code}",${item.scripticQty},${item.actualQty},${item.actualQty - item.scripticQty}`
    ).join("\n");
    
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name.replace(/\s+/g, '_')}_Inventar.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const processScan = async (code: string) => {
    if (!project) return;
    
    const items = [...project.items];
    const itemIndex = items.findIndex(i => i.code === code);

    if (itemIndex !== -1) {
      items[itemIndex].actualQty += 1;
      items[itemIndex].lastScannedAt = new Date().toISOString();
      await StorageService.updateProjectItems(projectId, items);
      // Optimistic update locally
      setProject(prev => prev ? { ...prev, items } : undefined);
      setLastScannedCode(code);
    } else {
        alert(`Cod necunoscut: ${code}`);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
        processScan(manualCode.trim());
        setManualCode('');
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-400">Se încarcă proiectul...</div>;
  if (!project) return <div className="p-8 text-center text-red-400">Proiectul nu a fost găsit.</div>;

  const filteredItems = project.items.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalScriptic = project.items.reduce((acc, i) => acc + i.scripticQty, 0);
  const totalActual = project.items.reduce((acc, i) => acc + i.actualQty, 0);
  const progress = totalScriptic > 0 ? Math.min(100, Math.round((totalActual / totalScriptic) * 100)) : 0;

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Top Navigation Bar */}
      <div className="bg-gray-800 shadow-md border-b border-gray-700 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={onBack} className="flex items-center text-gray-400 hover:text-white transition-colors">
            <ArrowLeft size={20} className="mr-1" />
            <span className="hidden sm:inline">Înapoi</span>
          </button>
          <h1 className="text-lg font-bold text-gray-100 truncate max-w-[200px] sm:max-w-md">
            {project.name}
          </h1>
          <div className="flex gap-2">
             {project.isLocked && (
                 <button onClick={handleExport} className="p-2 text-blue-400 hover:bg-gray-700 rounded-full transition-colors" title="Export CSV">
                     <Download size={20} />
                 </button>
             )}
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-7xl mx-auto w-full p-4 flex flex-col gap-6">
        
        {/* Setup Phase: Import CSV */}
        {!project.isLocked && (
          <div className="bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-700 text-center max-w-lg mx-auto mt-10">
            <div className="bg-blue-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Upload size={32} className="text-blue-400" />
            </div>
            <h2 className="text-xl font-bold mb-2 text-white">Importă Inventar Scriptic</h2>
            <p className="text-gray-400 mb-6">
              Încarcă un fișier CSV cu coloanele: <b>Denumire, Cod, Cantitate</b>.
              <br />
              <span className="text-xs text-red-400">Notă: Odată importat, acest proiect nu mai poate fi resetat.</span>
            </p>
            <label className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg cursor-pointer transition-colors shadow-lg shadow-blue-900/20">
              <span>Alege fișier CSV</span>
              <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>
        )}

        {/* Active Phase: Inventory & Scanning */}
        {project.isLocked && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 shadow-sm">
                   <p className="text-xs text-gray-400 uppercase font-semibold">Progres</p>
                   <p className="text-2xl font-bold text-blue-400">{progress}%</p>
               </div>
               <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 shadow-sm">
                   <p className="text-xs text-gray-400 uppercase font-semibold">Total Numărat</p>
                   <p className="text-2xl font-bold text-white">{totalActual}</p>
               </div>
               <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 shadow-sm">
                   <p className="text-xs text-gray-400 uppercase font-semibold">Scriptic</p>
                   <p className="text-2xl font-bold text-gray-500">{totalScriptic}</p>
               </div>
               <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 shadow-sm">
                   <p className="text-xs text-gray-400 uppercase font-semibold">Produse Unice</p>
                   <p className="text-2xl font-bold text-white">{project.items.length}</p>
               </div>
            </div>

            {/* Scanning Area - Manual Only */}
            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-sm">
                <form onSubmit={handleManualSubmit} className="relative w-full">
                    <div className="relative flex items-center">
                        <div className="absolute left-4 text-gray-500">
                            <Barcode size={24} />
                        </div>
                        <input
                            ref={manualInputRef}
                            type="text"
                            value={manualCode}
                            onChange={(e) => setManualCode(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 bg-gray-900 border-2 border-gray-700 rounded-lg focus:border-blue-500 focus:ring-0 outline-none text-xl text-white placeholder-gray-500 transition-all"
                            placeholder="Scanează sau introdu cod produs..."
                            autoComplete="off"
                        />
                        <button 
                            type="submit" 
                            className="absolute right-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={!manualCode.trim()}
                        >
                            Verifică
                        </button>
                    </div>
                    <p className="text-sm text-gray-500 mt-2 text-center">
                        Focusează câmpul de mai sus pentru a utiliza scanerul de mână.
                    </p>
                </form>
            </div>
            
            {/* Last Scanned Feedback */}
            {lastScannedCode && (
                <div className="bg-green-900/30 border border-green-800 text-green-300 px-4 py-2 rounded-lg flex items-center justify-between animate-fade-in">
                    <span className="font-medium">Ultimul scanat: {lastScannedCode}</span>
                    <button onClick={() => setLastScannedCode(null)} className="text-green-500 hover:text-green-200">&times;</button>
                </div>
            )}

            {/* Inventory Table */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 shadow-sm overflow-hidden flex-1 flex flex-col">
              <div className="p-4 border-b border-gray-700 flex items-center gap-2">
                 <Search size={18} className="text-gray-500" />
                 <input 
                    type="text" 
                    placeholder="Caută produse..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 bg-transparent outline-none text-sm text-white placeholder-gray-500"
                 />
              </div>
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-900/50 text-gray-400 font-medium border-b border-gray-700">
                    <tr>
                      <th className="p-4">Produs</th>
                      <th className="p-4">Cod</th>
                      <th className="p-4 text-center">Scriptic</th>
                      <th className="p-4 text-center">Faptic</th>
                      <th className="p-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {filteredItems.map((item, idx) => {
                        const diff = item.actualQty - item.scripticQty;
                        const isMatch = diff === 0;
                        const isOver = diff > 0;
                        
                        return (
                        <tr key={`${item.code}-${idx}`} className={`hover:bg-gray-700/50 transition-colors ${item.code === lastScannedCode ? 'bg-blue-900/20' : ''}`}>
                          <td className="p-4 font-medium text-gray-200">{item.name}</td>
                          <td className="p-4 text-gray-400 font-mono">{item.code}</td>
                          <td className="p-4 text-center text-gray-400">{item.scripticQty}</td>
                          <td className="p-4 text-center font-bold text-white">
                              <div className="inline-flex items-center justify-center min-w-[30px]">
                                {item.actualQty}
                              </div>
                          </td>
                          <td className="p-4 text-center">
                            {isMatch ? (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-900/30 text-green-400 border border-green-800">
                                    <CheckCircle size={12} className="mr-1" /> Ok
                                </span>
                            ) : (
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${isOver ? 'bg-blue-900/30 text-blue-400 border-blue-800' : 'bg-yellow-900/30 text-yellow-400 border-yellow-800'}`}>
                                    <AlertTriangle size={12} className="mr-1" /> {diff > 0 ? `+${diff}` : diff}
                                </span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                    {filteredItems.length === 0 && (
                        <tr>
                            <td colSpan={5} className="p-8 text-center text-gray-500">Nu s-au găsit produse.</td>
                        </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ProjectView;