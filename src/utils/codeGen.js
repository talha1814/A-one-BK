// Password & Unique ID generators
export function generateRandomPassword() {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  const uppers = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  
  const part1 = Array.from({ length: 4 }, () => uppers[Math.floor(Math.random() * uppers.length)]).join('');
  const part2 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  const part3 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');

  return `AONE-${part1}-${part2}`;
}

export function generateClientId(existingClients = []) {
  const count = existingClients.length + 1;
  let id = `CL${String(count).padStart(3, '0')}`;
  
  // ensure unique
  let idx = count;
  while (existingClients.some(c => c.id === id)) {
    idx++;
    id = `CL${String(idx).padStart(3, '0')}`;
  }
  return id;
}

export function generateLogId() {
  return `LOG-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;
}
