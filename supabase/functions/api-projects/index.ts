import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const MOBILE_API_KEY = Deno.env.get('MOBILE_API_KEY') || 'mobile_app_key_here';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Validate API key
    const apiKey = req.headers.get('X-API-Key');
    if (apiKey !== MOBILE_API_KEY) {
      return new Response(JSON.stringify({ error: 'Invalid API key' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get user ID from auth header
    const auth = req.headers.get('Authorization');
    const userId = auth?.split(' ')[1];
    
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(req.url);
    const path = url.pathname.split('/').filter(p => p);
    const endpoint = path[path.length - 1];

    // Handle different endpoints
    switch (endpoint) {
      case 'available': {
        // GET /api-projects/available - Get all available projects
        if (req.method !== 'GET') {
          return new Response('Method not allowed', { status: 405 });
        }
        
        const { data: projects, error } = await supabase
          .from('projects')
          .select('*')
          .eq('is_active', true)
          .order('name');
          
        if (error) throw error;
        
        // Get user's subscriptions
        const { data: userSubs } = await supabase
          .from('user_projects')
          .select('project_id')
          .eq('user_id', userId)
          .eq('is_active', true);
          
        const subscribedIds = userSubs?.map(s => s.project_id) || [];
        
        // Mark which projects user is subscribed to
        const projectsWithStatus = projects.map(project => ({
          ...project,
          is_subscribed: subscribedIds.includes(project.id),
        }));
        
        return new Response(JSON.stringify(projectsWithStatus), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      case 'subscribed': {
        // GET /api-projects/subscribed - Get user's subscribed projects
        if (req.method !== 'GET') {
          return new Response('Method not allowed', { status: 405 });
        }
        
        const { data: userProjects, error } = await supabase
          .from('user_projects_detailed')
          .select('*')
          .eq('user_id', userId)
          .eq('is_active', true);
          
        if (error) throw error;
        
        return new Response(JSON.stringify(userProjects || []), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      case 'subscribe': {
        // POST /api-projects/subscribe - Subscribe to a project
        if (req.method !== 'POST') {
          return new Response('Method not allowed', { status: 405 });
        }
        
        const { project_id, custom_threshold } = await req.json();
        
        if (!project_id) {
          return new Response(JSON.stringify({ error: 'project_id required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        // Check user's project limit
        const { count } = await supabase
          .from('user_projects')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('is_active', true);
          
        const { data: user } = await supabase
          .from('users')
          .select('projects_limit')
          .eq('id', userId)
          .single();
          
        if (count >= (user?.projects_limit || 5)) {
          return new Response(JSON.stringify({ 
            error: 'Project limit reached',
            limit: user?.projects_limit || 5,
            current: count
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        // Check if already subscribed
        const { data: existing } = await supabase
          .from('user_projects')
          .select('*')
          .eq('user_id', userId)
          .eq('project_id', project_id)
          .single();
          
        if (existing && existing.is_active) {
          return new Response(JSON.stringify({ 
            error: 'Already subscribed to this project' 
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        // Subscribe or reactivate
        if (existing) {
          // Reactivate existing subscription
          const { error } = await supabase
            .from('user_projects')
            .update({ 
              is_active: true,
              custom_threshold,
              updated_at: new Date().toISOString()
            })
            .eq('id', existing.id);
            
          if (error) throw error;
        } else {
          // Create new subscription
          const { error } = await supabase
            .from('user_projects')
            .insert({
              user_id: userId,
              project_id,
              custom_threshold,
              is_active: true
            });
            
          if (error) throw error;
        }
        
        // Return the project details
        const { data: project } = await supabase
          .from('projects')
          .select('*')
          .eq('id', project_id)
          .single();
        
        return new Response(JSON.stringify({
          success: true,
          project
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      case 'unsubscribe': {
        // POST /api-projects/unsubscribe - Unsubscribe from a project
        if (req.method !== 'POST') {
          return new Response('Method not allowed', { status: 405 });
        }
        
        const { project_id } = await req.json();
        
        if (!project_id) {
          return new Response(JSON.stringify({ error: 'project_id required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        // Soft delete by setting is_active to false
        const { error } = await supabase
          .from('user_projects')
          .update({ 
            is_active: false,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)
          .eq('project_id', project_id);
          
        if (error) throw error;
        
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      case 'update-threshold': {
        // PUT /api-projects/update-threshold - Update notification threshold
        if (req.method !== 'PUT') {
          return new Response('Method not allowed', { status: 405 });
        }
        
        const { project_id, custom_threshold } = await req.json();
        
        if (!project_id) {
          return new Response(JSON.stringify({ error: 'project_id required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        const { error } = await supabase
          .from('user_projects')
          .update({ 
            custom_threshold,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)
          .eq('project_id', project_id);
          
        if (error) throw error;
        
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      default:
        return new Response(JSON.stringify({ 
          error: 'Invalid endpoint',
          validEndpoints: [
            '/api-projects/available',
            '/api-projects/subscribed',
            '/api-projects/subscribe',
            '/api-projects/unsubscribe',
            '/api-projects/update-threshold'
          ]
        }), { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
    
  } catch (error) {
    console.error('API error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});