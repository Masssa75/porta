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
    const projectId = url.pathname.split('/').pop();

    switch (req.method) {
      case 'GET': {
        // List user's projects
        const { data: projects, error } = await supabase
          .from('projects')
          .select(`
            *,
            tweet_analyses(
              id,
              importance_score,
              summary,
              created_at
            )
          `)
          .eq('user_id', userId)
          .eq('is_active', true)
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        
        // Add latest alert info
        const projectsWithAlerts = projects.map(project => ({
          ...project,
          latestAlert: project.tweet_analyses?.[0]?.summary || null,
          notifications: true, // Default to on
        }));
        
        return new Response(JSON.stringify(projectsWithAlerts), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      case 'POST': {
        const { coingeckoId, name, symbol, image } = await req.json();
        
        // Check user's project limit
        const { count } = await supabase
          .from('projects')
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
            limit: user?.projects_limit || 5 
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        // Create project
        const { data: project, error } = await supabase
          .from('projects')
          .insert({
            user_id: userId,
            coingecko_id: coingeckoId,
            name,
            symbol: symbol.toUpperCase(),
            twitter_handle: `@${name.toLowerCase().replace(/\s+/g, '')}`,
            is_active: true,
          })
          .select()
          .single();
          
        if (error) throw error;
        
        return new Response(JSON.stringify({
          ...project,
          image,
          notifications: true,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      case 'DELETE': {
        if (!projectId || projectId === 'api-projects') {
          return new Response('Project ID required', { status: 400 });
        }
        
        // Soft delete by setting is_active to false
        const { error } = await supabase
          .from('projects')
          .update({ is_active: false })
          .eq('id', projectId)
          .eq('user_id', userId);
          
        if (error) throw error;
        
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      case 'PUT': {
        if (!projectId || projectId === 'api-projects') {
          return new Response('Project ID required', { status: 400 });
        }
        
        const { alert_threshold } = await req.json();
        
        const { error } = await supabase
          .from('projects')
          .update({ 
            alert_threshold,
            updated_at: new Date().toISOString(),
          })
          .eq('id', projectId)
          .eq('user_id', userId);
          
        if (error) throw error;
        
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      default:
        return new Response('Method not allowed', { status: 405 });
    }
    
  } catch (error) {
    console.error('API error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});