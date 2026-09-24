import { addDays } from 'date-fns';
import { generateClientId, generateLogId } from './codeGen';
import { isLicenceExpired, getDaysRemaining, calculateNewExpiry } from './dateHelpers';
import { fetchRemoteClient, syncClientToCloud } from './cloud';

// LocalStorage Keys
export const STORAGE_KEYS = {
  CLIENTS: 'aone_clients',
  CURRENT_SESSION: 'aone_current_session',
  ADMIN_CONFIG: 'aone_admin_config',
  ADMIN_SESSION: 'aone_admin_session',
  ACTION_LOGS: 'aone_action_logs',
};

// Default Admin Config
const DEFAULT_ADMIN_CONFIG = {
  username: 'admin',
  password: 'adminpass123',
  contactPhone: '0300-1234567',
  whatsappNumber: '923001234567',
  defaultDurationDays: 30,
};

// Initial Seed Client
function getInitialClients() {
  const expiryDate = addDays(new Date(), 30);
  expiryDate.setHours(23, 59, 59, 999);

  return [
    {
      id: 'CL001',
      username: 'aone001',
      password: 'pass123',
      shopName: 'A-one Bun Kabab',
      phone: '0300-1234567',
      createdOn: new Date().toISOString().split('T')[0],
      expiresOn: expiryDate.toISOString(),
      status: 'active',
      forceBlocked: false,
    },
  ];
}

export function getAdminConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ADMIN_CONFIG);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.ADMIN_CONFIG, JSON.stringify(DEFAULT_ADMIN_CONFIG));
      return DEFAULT_ADMIN_CONFIG;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_ADMIN_CONFIG;
  }
}

export function saveAdminConfig(config) {
  localStorage.setItem(STORAGE_KEYS.ADMIN_CONFIG, JSON.stringify(config));
}

export function getClients() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CLIENTS);
    if (!raw) {
      const initial = getInitialClients();
      localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      const initial = getInitialClients();
      localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(initial));
      return initial;
    }
    return parsed;
  } catch {
    return getInitialClients();
  }
}

export function saveClients(clients) {
  localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
}

// Action & Payment Logs
export function getActionLogs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ACTION_LOGS);
    if (!raw) {
      const initial = [
        {
          id: generateLogId(),
          date: new Date().toISOString(),
          clientId: 'CL001',
          clientUsername: 'aone001',
          action: 'Initial Account Created',
          amount: 0,
          newExpiry: addDays(new Date(), 30).toISOString(),
        },
      ];
      localStorage.setItem(STORAGE_KEYS.ACTION_LOGS, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function logAction({ clientId, clientUsername, action, amount = 0, newExpiry = null }) {
  const logs = getActionLogs();
  const entry = {
    id: generateLogId(),
    date: new Date().toISOString(),
    clientId,
    clientUsername,
    action,
    amount: Number(amount) || 0,
    newExpiry,
  };
  const updated = [entry, ...logs];
  localStorage.setItem(STORAGE_KEYS.ACTION_LOGS, JSON.stringify(updated));
  return entry;
}

// Client Session
export function getClientSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_SESSION);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setClientSession(session) {
  if (session) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_SESSION, JSON.stringify(session));
  } else {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_SESSION);
  }
}

// Client Verification & Status Check
export async function checkClientLicence() {
  const session = getClientSession();
  if (!session || !session.clientId) {
    return { status: 'NO_SESSION' };
  }

  let clients = getClients();
  let client = clients.find((c) => c.id === session.clientId || c.username === session.username);

  // Try fetching latest remote record if cloud is active
  const remote = await fetchRemoteClient(session.clientId);
  if (remote) {
    client = remote;
    // update local cache
    clients = clients.map((c) => (c.id === remote.id ? remote : c));
    saveClients(clients);
  }

  if (!client) {
    setClientSession(null);
    return { status: 'INVALID_CLIENT' };
  }

  // 1. Check Force Blocked
  if (client.forceBlocked) {
    return {
      status: 'BLOCKED',
      client,
      message: 'Account has been temporarily blocked by administration.',
    };
  }

  // 2. Check Expiry
  if (isLicenceExpired(client.expiresOn)) {
    return {
      status: 'EXPIRED',
      client,
      message: 'Licence expired. Please contact support.',
    };
  }

  // 3. Valid (Check if warning needed: <= 7 days)
  const daysLeft = getDaysRemaining(client.expiresOn);
  return {
    status: 'ACTIVE',
    client,
    daysLeft,
    isWarning: daysLeft <= 7,
  };
}

export function clientLogin(username, password) {
  const clients = getClients();
  const client = clients.find(
    (c) => c.username.trim().toLowerCase() === username.trim().toLowerCase()
  );

  if (!client) {
    return { success: false, message: 'Invalid credentials. User not found.' };
  }

  if (client.password !== password) {
    return { success: false, message: 'Incorrect password.' };
  }

  if (client.forceBlocked) {
    return { success: false, message: 'Account is blocked by administration.', blocked: true };
  }

  if (isLicenceExpired(client.expiresOn)) {
    return {
      success: false,
      message: 'Licence has expired. Please contact administration.',
      expired: true,
      client,
    };
  }

  const session = {
    clientId: client.id,
    username: client.username,
    shopName: client.shopName,
    loggedInAt: new Date().toISOString(),
  };

  setClientSession(session);
  return { success: true, client, session };
}

export function clientLogout() {
  setClientSession(null);
}

// Admin Session (30 min auto-logout)
const ADMIN_TIMEOUT_MS = 30 * 60 * 1000;

export function adminLogin(username, password) {
  const config = getAdminConfig();
  if (username === config.username && password === config.password) {
    const session = { loggedIn: true, lastActive: Date.now() };
    localStorage.setItem(STORAGE_KEYS.ADMIN_SESSION, JSON.stringify(session));
    return { success: true };
  }
  return { success: false, message: 'Invalid admin username or password' };
}

export function verifyAdminSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ADMIN_SESSION);
    if (!raw) return false;
    const session = JSON.parse(raw);
    if (!session || !session.loggedIn) return false;

    // Check 30 min idle timeout
    if (Date.now() - session.lastActive > ADMIN_TIMEOUT_MS) {
      adminLogout();
      return false;
    }

    // Refresh last active
    session.lastActive = Date.now();
    localStorage.setItem(STORAGE_KEYS.ADMIN_SESSION, JSON.stringify(session));
    return true;
  } catch {
    return false;
  }
}

export function adminLogout() {
  localStorage.removeItem(STORAGE_KEYS.ADMIN_SESSION);
}

// Admin Client Management CRUD
export async function addClient({ username, password, shopName, phone, durationDays, amount = 0 }) {
  const clients = getClients();

  // Validate duplicate username
  if (clients.some((c) => c.username.toLowerCase() === username.trim().toLowerCase())) {
    throw new Error('A client with this username already exists.');
  }

  const id = generateClientId(clients);
  const now = new Date();
  const expiry = addDays(now, Number(durationDays || 30));
  expiry.setHours(23, 59, 59, 999);

  const newClient = {
    id,
    username: username.trim(),
    password: password.trim(),
    shopName: shopName.trim() || 'A-one Bun Kabab',
    phone: phone.trim() || '0300-1234567',
    createdOn: now.toISOString().split('T')[0],
    expiresOn: expiry.toISOString(),
    status: 'active',
    forceBlocked: false,
  };

  const updated = [newClient, ...clients];
  saveClients(updated);

  logAction({
    clientId: id,
    clientUsername: newClient.username,
    action: `Created new client (${durationDays} days)`,
    amount: Number(amount) || 0,
    newExpiry: newClient.expiresOn,
  });

  await syncClientToCloud(newClient);
  return newClient;
}

export async function editClient(id, updates) {
  const clients = getClients();
  const idx = clients.findIndex((c) => c.id === id);
  if (idx === -1) throw new Error('Client not found');

  const updatedClient = { ...clients[idx], ...updates };
  clients[idx] = updatedClient;
  saveClients(clients);

  logAction({
    clientId: id,
    clientUsername: updatedClient.username,
    action: 'Client details updated by admin',
  });

  await syncClientToCloud(updatedClient);
  return updatedClient;
}

export async function extendClientExpiry(id, daysToAdd, amount = 0) {
  const clients = getClients();
  const idx = clients.findIndex((c) => c.id === id);
  if (idx === -1) throw new Error('Client not found');

  const client = clients[idx];
  const newExpiry = calculateNewExpiry(client.expiresOn, daysToAdd);

  const updatedClient = {
    ...client,
    expiresOn: newExpiry,
    status: 'active',
  };

  clients[idx] = updatedClient;
  saveClients(clients);

  logAction({
    clientId: id,
    clientUsername: client.username,
    action: `Expiry extended by +${daysToAdd} days`,
    amount: Number(amount) || 0,
    newExpiry,
  });

  await syncClientToCloud(updatedClient);
  return updatedClient;
}

export async function toggleForceBlockClient(id, forceBlocked) {
  const clients = getClients();
  const idx = clients.findIndex((c) => c.id === id);
  if (idx === -1) throw new Error('Client not found');

  const client = clients[idx];
  const updatedClient = {
    ...client,
    forceBlocked: Boolean(forceBlocked),
    status: forceBlocked ? 'blocked' : (isLicenceExpired(client.expiresOn) ? 'expired' : 'active'),
  };

  clients[idx] = updatedClient;
  saveClients(clients);

  logAction({
    clientId: id,
    clientUsername: client.username,
    action: forceBlocked ? '🔴 FORCE BLOCKED by admin' : '🟢 UNBLOCKED by admin',
  });

  await syncClientToCloud(updatedClient);
  return updatedClient;
}

export function deleteClient(id) {
  const clients = getClients();
  const clientToDelete = clients.find((c) => c.id === id);
  const updated = clients.filter((c) => c.id !== id);
  saveClients(updated);

  if (clientToDelete) {
    logAction({
      clientId: id,
      clientUsername: clientToDelete.username,
      action: 'Client deleted',
    });
  }

  // If current session is this client, logout
  const session = getClientSession();
  if (session && session.clientId === id) {
    clientLogout();
  }
}

// Backup & Restore
export function exportAllDataBackup() {
  const backup = {
    clients: getClients(),
    adminConfig: getAdminConfig(),
    actionLogs: getActionLogs(),
    posData: JSON.parse(localStorage.getItem('aone_bun_kabab_pos_v1') || '{}'),
    timestamp: new Date().toISOString(),
  };

  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `aone_pos_backup_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function restoreAllDataFromJSON(jsonString) {
  try {
    const data = JSON.parse(jsonString);
    if (data.clients) saveClients(data.clients);
    if (data.adminConfig) saveAdminConfig(data.adminConfig);
    if (data.actionLogs) localStorage.setItem(STORAGE_KEYS.ACTION_LOGS, JSON.stringify(data.actionLogs));
    if (data.posData) localStorage.setItem('aone_bun_kabab_pos_v1', JSON.stringify(data.posData));
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
