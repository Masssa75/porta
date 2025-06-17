'use client';

import { Bell, BellOff, Settings, Trash2 } from 'lucide-react';

interface ProjectListProps {
  projects: any[];
  onUpdate: (projects: any[]) => void;
}

export default function ProjectList({ projects, onUpdate }: ProjectListProps) {
  const toggleNotifications = (projectId: string) => {
    const updated = projects.map(p => 
      p.id === projectId ? { ...p, notifications: !p.notifications } : p
    );
    onUpdate(updated);
  };

  const removeProject = (projectId: string) => {
    onUpdate(projects.filter(p => p.id !== projectId));
  };

  return (
    <div className="space-y-3">
      {projects.map((project) => (
        <div
          key={project.id}
          className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {project.image && (
                <img
                  src={project.image}
                  alt={project.name}
                  className="w-10 h-10 rounded-full"
                />
              )}
              <div>
                <h3 className="font-medium">{project.name}</h3>
                <p className="text-sm text-gray-500 uppercase">{project.symbol}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => toggleNotifications(project.id)}
                className={`p-2 rounded-lg transition-colors ${
                  project.notifications 
                    ? 'bg-secondary/10 text-secondary' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-500'
                }`}
              >
                {project.notifications ? (
                  <Bell className="w-4 h-4" />
                ) : (
                  <BellOff className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={() => removeProject(project.id)}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {/* Latest Alert Preview */}
          <div className="mt-3 p-2 bg-gray-50 dark:bg-gray-900 rounded text-sm text-gray-600 dark:text-gray-400">
            <p className="text-xs opacity-75 mb-1">Latest alert:</p>
            <p className="line-clamp-2">
              {project.latestAlert || 'No recent alerts'}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}