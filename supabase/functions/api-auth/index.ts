import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Mobile app API key validation
const MOBILE_API_KEY = Deno.env.get('MOBILE_API_KEY') || 'mobile_app_key_here';

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname.split('/').pop();
    
    // Validate API key
    const apiKey = req.headers.get('X-API-Key');
    if (apiKey !== MOBILE_API_KEY) {
      return new Response(JSON.stringify({ error: 'Invalid API key' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Route handling
    switch (path) {
      case 'register': {
        if (req.method !== 'POST') {
          return new Response('Method not allowed', { status: 405 });
        }
        
        const { telegramId, telegramUsername, referralCode } = await req.json();
        
        // Check if user exists
        const { data: existingUser } = await supabase
          .from('users')
          .select('*')
          .eq('telegram_chat_id', telegramId)
          .single();
          
        if (existingUser) {
          return new Response(JSON.stringify({ 
            user: existingUser,
            isNew: false 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        // Create new user
        const { data: newUser, error } = await supabase
          .from('users')
          .insert({
            telegram_chat_id: telegramId,
            telegram_username: telegramUsername,
            telegram_verified: true,
            status: 'verified',
            referred_by: referralCode ? await getReferrerIdByCode(referralCode) : null,
          })
          .select()
          .single();
          
        if (error) throw error;
        
        // Handle referral if provided
        if (referralCode && newUser.referred_by) {
          await supabase
            .from('referrals')
            .insert({
              referrer_id: newUser.referred_by,
              referred_id: newUser.id,
              referral_method: 'telegram',
              status: 'verified',
              verified_at: new Date().toISOString(),
            });
        }
        
        return new Response(JSON.stringify({ 
          user: newUser,
          isNew: true 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      case 'telegram-verify': {
        if (req.method !== 'POST') {
          return new Response('Method not allowed', { status: 405 });
        }
        
        const { token, chatId } = await req.json();
        
        // Verify telegram connection
        const { data: connection } = await supabase
          .from('telegram_connections')
          .select('*')
          .eq('connection_token', token)
          .single();
          
        if (!connection) {
          return new Response(JSON.stringify({ error: 'Invalid token' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        // Update connection with chat ID
        await supabase
          .from('telegram_connections')
          .update({
            telegram_chat_id: chatId,
            connected_at: new Date().toISOString(),
          })
          .eq('id', connection.id);
          
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      case 'check-connection': {
        if (req.method !== 'POST') {
          return new Response('Method not allowed', { status: 405 });
        }
        
        const { token } = await req.json();
        
        // Check if connection has been established
        const { data: user } = await supabase
          .from('users')
          .select('*')
          .eq('connection_token', token)
          .single();
          
        if (!user || !user.telegram_chat_id) {
          return new Response(JSON.stringify({ connected: false }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        return new Response(JSON.stringify({ 
          connected: true,
          user: {
            id: user.id,
            telegram_chat_id: user.telegram_chat_id,
            telegram_username: user.telegram_username,
            tier: user.tier,
            referral_code: user.referral_code,
            referrals_completed: user.referrals_completed,
            projects_limit: user.projects_limit
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      case 'profile': {
        if (req.method !== 'GET') {
          return new Response('Method not allowed', { status: 405 });
        }
        
        const auth = req.headers.get('Authorization');
        const userId = auth?.split(' ')[1]; // Bearer <userId>
        
        if (!userId) {
          return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        const { data: user, error } = await supabase
          .from('users')
          .select(`
            *,
            referrals!referrer_id(
              id,
              status,
              created_at
            )
          `)
          .eq('id', userId)
          .single();
          
        if (error) throw error;
        
        return new Response(JSON.stringify(user), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      default:
        return new Response('Not found', { status: 404 });
    }
    
  } catch (error) {
    console.error('API error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function getReferrerIdByCode(code: string) {
  const { data } = await supabase
    .from('users')
    .select('id')
    .eq('referral_code', code)
    .single();
  return data?.id || null;
}