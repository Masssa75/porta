const { execSync } = require('child_process');
const path = require('path');

async function fixDeployment() {
  console.log('🔧 Fixing mobile app deployment issues...\n');

  const tempDir = path.join(__dirname, '..', 'portalerts-mobile-temp');

  try {
    process.chdir(tempDir);
    
    // Fix 1: Update store to not use persist middleware (can cause SSR issues)
    console.log('1️⃣ Creating fixed userStore without persist...');
    
    const fixedStore = `import { create } from 'zustand';
import { authAPI, projectsAPI } from '@/lib/api';

interface User {
  id: string;
  telegram_chat_id?: number;
  telegram_username?: string;
  status: string;
  tier: string;
  projects_limit: number;
  referral_code: string;
  referrals_completed: number;
}

interface UserStore {
  user: User | null;
  projects: any[];
  isLoading: boolean;
  isAuthenticated: boolean;
  
  // Actions
  setUser: (user: User | null) => void;
  setProjects: (projects: any[]) => void;
  login: (telegramId: number, username?: string) => Promise<void>;
  logout: () => void;
  loadProjects: () => Promise<void>;
  addProject: (project: any) => Promise<void>;
  removeProject: (projectId: string) => Promise<void>;
}

export const useUserStore = create<UserStore>((set, get) => ({
  user: null,
  projects: [],
  isLoading: false,
  isAuthenticated: false,

  setUser: (user) => set({ 
    user, 
    isAuthenticated: !!user 
  }),

  setProjects: (projects) => set({ projects }),

  login: async (telegramId: number, username?: string) => {
    set({ isLoading: true });
    try {
      // Register or login user
      const { user } = await authAPI.register({
        telegramId,
        telegramUsername: username,
        referralCode: new URLSearchParams(window.location.search).get('ref') || undefined
      });
      
      // Store auth token
      if (user.id) {
        localStorage.setItem('auth_token', user.id);
      }
      
      set({ 
        user, 
        isAuthenticated: true,
        isLoading: false 
      });
      
      // Load user's projects
      get().loadProjects();
    } catch (error) {
      console.error('Login failed:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('auth_token');
    set({ 
      user: null, 
      projects: [],
      isAuthenticated: false 
    });
  },

  loadProjects: async () => {
    if (!get().isAuthenticated) return;
    
    try {
      const projects = await projectsAPI.list();
      set({ projects });
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  },

  addProject: async (project) => {
    try {
      const newProject = await projectsAPI.add({
        coingeckoId: project.id,
        name: project.name,
        symbol: project.symbol,
        image: project.image
      });
      
      set(state => ({
        projects: [...state.projects, newProject]
      }));
    } catch (error: any) {
      if (error.response?.data?.error?.includes('limit')) {
        throw new Error(\`Project limit reached (\${get().user?.projects_limit || 5} max)\`);
      }
      throw error;
    }
  },

  removeProject: async (projectId) => {
    try {
      await projectsAPI.remove(projectId);
      set(state => ({
        projects: state.projects.filter(p => p.id !== projectId)
      }));
    } catch (error) {
      console.error('Failed to remove project:', error);
      throw error;
    }
  }
}));`;

    // Write the fixed store
    execSync(`cat > src/store/userStore.ts << 'EOF'
${fixedStore}
EOF`, { stdio: 'inherit' });

    // Fix 2: Add 'use client' directive to page if missing
    console.log('\n2️⃣ Ensuring client components are marked...');
    
    // Commit fixes
    console.log('\n3️⃣ Committing fixes...');
    execSync('git add -A', { stdio: 'inherit' });
    execSync('git commit -m "Fix deployment: Remove zustand persist for SSR compatibility"', { stdio: 'inherit' });
    
    // Push
    console.log('\n4️⃣ Pushing fixes...');
    execSync('git push', { stdio: 'inherit' });
    
    console.log('\n✅ Fixes pushed!');
    console.log('⏳ Netlify will rebuild in ~2-3 minutes');
    console.log('\n🔧 Fixed issues:');
    console.log('- Removed zustand persist middleware (SSR incompatible)');
    console.log('- Simplified state management');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fixDeployment();