import { createClient } from '@supabase/supabase-js';

// Retrieve cloud settings from localStorage or environment variables
export function getCloudConfig() {
  const saved = localStorage.getItem('aone_cloud_config');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // fallback
    }
  }

  return {
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
    supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
    enabled: Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY),
  };
}

export function saveCloudConfig(config) {
  localStorage.setItem('aone_cloud_config', JSON.stringify(config));
}

let supabaseInstance = null;

export function getSupabase() {
  const config = getCloudConfig();
  if (!config.enabled || !config.supabaseUrl || !config.supabaseAnonKey) {
    return null;
  }

  if (!supabaseInstance) {
    try {
      supabaseInstance = createClient(config.supabaseUrl, config.supabaseAnonKey);
    } catch (err) {
      console.error('Supabase init failed:', err);
      return null;
    }
  }
  return supabaseInstance;
}

// Fetch single client from cloud (used by ClientGate on open and 30-min timer)
export async function fetchRemoteClient(clientId) {
  const sb = getSupabase();
  if (!sb || !clientId) return null;

  try {
    const { data, error } = await sb
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      username: data.username,
      password: data.password || data.password_hash,
      shopName: data.shop_name,
      phone: data.phone,
      createdOn: data.created_at || data.createdOn,
      expiresOn: data.expires_on || data.expiresOn,
      status: data.force_blocked ? 'blocked' : (new Date(data.expires_on) < new Date() ? 'expired' : 'active'),
      forceBlocked: Boolean(data.force_blocked),
    };
  } catch (err) {
    console.warn('Could not fetch remote client from cloud:', err);
    return null;
  }
}

// Sync client list to cloud (used by Admin when saving or updating)
export async function syncClientToCloud(client) {
  const sb = getSupabase();
  if (!sb || !client) return false;

  try {
    const { error } = await sb.from('clients').upsert({
      id: client.id,
      username: client.username,
      password: client.password,
      shop_name: client.shopName,
      phone: client.phone,
      created_at: client.createdOn,
      expires_on: client.expiresOn,
      force_blocked: Boolean(client.forceBlocked),
    });

    if (error) {
      console.warn('Supabase upsert error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Failed to sync client to Supabase:', err);
    return false;
  }
}
