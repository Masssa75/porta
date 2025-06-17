'use client';

import { useState, useEffect } from 'react';
import { Search, Bell, Users, Sparkles, Check, X } from 'lucide-react';
import CryptoSearch from '@/components/CryptoSearch';
import ProjectList from '@/components/ProjectList';
import TelegramConnect from '@/components/TelegramConnect';
import ReferralSection from '@/components/ReferralSection';
import PremiumSection from '@/components/PremiumSection';
import { useUserStore } from '@/store/userStore';

export default function Home() {
  const { user, projects, isAuthenticated, loadProjects, addProject, removeProject } = useUserStore();
  const [searchOpen, setSearchOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load projects on mount if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadProjects();
    }
  }, [isAuthenticated]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-black">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800">
        <div className="px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-6 h-6 text-secondary" />
            <h1 className="text-xl font-bold">PortAlerts</h1>
          </div>
          <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <Bell className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Tagline */}
      <div className="px-4 pt-6 pb-4">
        <p className="text-center text-gray-600 dark:text-gray-300">
          Get instant notifications on important events for any coin
        </p>
      </div>

      {/* Search Section */}
      <div className="px-4 pb-6">
        <button
          onClick={() => setSearchOpen(true)}
          className="w-full flex items-center justify-between bg-white dark:bg-gray-800 rounded-xl px-4 py-3 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all"
        >
          <div className="flex items-center space-x-3 text-gray-500">
            <Search className="w-5 h-5" />
            <span>Search coins...</span>
          </div>
        </button>
      </div>

      {/* Your Projects */}
      {projects.length > 0 && (
        <div className="px-4 pb-6">
          <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">
            Your Coins ({projects.length}{user?.projects_limit ? `/${user.projects_limit}` : ''})
          </h2>
          <ProjectList 
            projects={projects} 
            onUpdate={async (updatedProjects) => {
              // Handle removes
              const removed = projects.filter(p => !updatedProjects.find(up => up.id === p.id));
              for (const project of removed) {
                await removeProject(project.id);
              }
            }} 
          />
        </div>
      )}

      {/* Telegram Connection */}
      <div className="px-4 pb-6">
        <TelegramConnect 
          isConnected={isAuthenticated} 
          onConnect={(connected) => {
            if (connected) {
              loadProjects();
            }
          }} 
        />
      </div>

      {/* Referral Section */}
      {user && (
        <div className="px-4 pb-6">
          <ReferralSection 
            referralCount={user.referrals_completed || 0} 
            referralGoal={5}
            referralCode={user.referral_code}
          />
        </div>
      )}

      {/* Premium Section */}
      <div className="px-4 pb-20">
        <PremiumSection />
      </div>

      {/* Search Modal */}
      {searchOpen && (
        <CryptoSearch 
          onClose={() => setSearchOpen(false)}
          onSelect={async (project) => {
            try {
              await addProject(project);
              setSearchOpen(false);
              setError(null);
            } catch (err: any) {
              setError(err.message);
              // Show error toast or alert
              alert(err.message);
            }
          }}
        />
      )}
    </main>
  );
}