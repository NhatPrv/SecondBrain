const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Get stored JWT token
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

// Save JWT token and store user details
export function setAuth(token: string, user: any) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
  // Set cookie for server-side compatibility if needed
  document.cookie = `token=${token}; path=/; max-age=604800; SameSite=Lax`;
}

// Clear authentication data on logout
export function clearAuth() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
}

// Get cached user details
export function getCachedUser() {
  if (typeof window === 'undefined') return null;
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
}

// Custom authenticated fetch wrapper
async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const token = getToken();
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Set Content-Type only if it's not FormData (which sets its own boundary)
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = 'An error occurred';
    try {
      const errData = await response.json();
      errorMessage = errData.message || errorMessage;
    } catch {
      // ignore
    }
    throw new Error(errorMessage);
  }

  // Return raw response if doing file streaming/downloads
  if (options.method === 'GET' && endpoint.includes('/files/download/')) {
    return response;
  }

  return response.json();
}

// API methods
export const api = {
  // Auth
  auth: {
    login: (credentials: { email: string; password?: string }) => 
      apiFetch('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
    signup: (data: { name: string; email: string; password?: string }) => 
      apiFetch('/auth/signup', { method: 'POST', body: JSON.stringify(data) }),
    me: () => 
      apiFetch('/auth/me', { method: 'GET' }),
  },
  
  // Users / Family Members
  users: {
    list: () => apiFetch('/users'),
    get: (id: string) => apiFetch(`/users/${id}`),
  },

  // Chat/Messenger
  chat: {
    conversations: () => apiFetch('/chat/conversations'),
    messages: (conversationId: string) => apiFetch(`/chat/conversations/${conversationId}/messages`),
    getOrCreateDirect: (targetUserId: string) => 
      apiFetch('/chat/conversations/direct', { method: 'POST', body: JSON.stringify({ targetUserId }) }),
    createGroup: (name: string, memberIds: string[]) => 
      apiFetch('/chat/conversations/group', { method: 'POST', body: JSON.stringify({ name, memberIds }) }),
  },

  // Files/Drive
  files: {
    storage: () => apiFetch('/files/storage'),
    list: (parentId: string | null = null, query: string = '') => 
      apiFetch(`/files?parentId=${parentId || ''}&query=${encodeURIComponent(query)}`),
    createFolder: (name: string, parentId: string | null = null) => 
      apiFetch('/files/folder', { method: 'POST', body: JSON.stringify({ name, parentId }) }),
    upload: (file: File, parentId: string | null = null, onProgress?: (percentage: number) => void): Promise<any> => {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const formData = new FormData();
        formData.append('file', file);
        if (parentId) {
          formData.append('parentId', parentId);
        }

        xhr.open('POST', `${API_BASE}/files/upload`);
        
        const token = getToken();
        if (token) {
          xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        }

        if (onProgress) {
          xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
              const percentage = Math.round((event.loaded / event.total) * 100);
              onProgress(percentage);
            }
          });
        }

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              resolve(JSON.parse(xhr.responseText));
            } catch {
              resolve(xhr.responseText);
            }
          } else {
            let errorMessage = 'Upload failed';
            try {
              const errData = JSON.parse(xhr.responseText);
              errorMessage = errData.message || errorMessage;
            } catch {}
            reject(new Error(errorMessage));
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Network error during upload'));
        });

        xhr.send(formData);
      });
    },
    delete: (id: string) => 
      apiFetch(`/files/${id}`, { method: 'DELETE' }),
    rename: (id: string, name: string) => 
      apiFetch(`/files/${id}/rename`, { method: 'PATCH', body: JSON.stringify({ name }) }),
    move: (id: string, targetFolderId: string | null) => 
      apiFetch(`/files/${id}/move`, { method: 'PATCH', body: JSON.stringify({ targetFolderId }) }),
    star: (id: string) => 
      apiFetch(`/files/${id}/star`, { method: 'PATCH' }),
    downloadUrl: (id: string) => 
      `${API_BASE}/files/download/${id}`,
  },

  // Notes
  notes: {
    list: (category?: string) => 
      apiFetch(`/notes${category ? `?category=${encodeURIComponent(category)}` : ''}`),
    get: (id: string) => apiFetch(`/notes/${id}`),
    create: (data: { title: string; body: string; category: string; color: string; tags: string[]; pinned?: boolean }) => 
      apiFetch('/notes', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<{ title: string; body: string; category: string; color: string; tags: string[]; pinned: boolean }>) => 
      apiFetch(`/notes/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => 
      apiFetch(`/notes/${id}`, { method: 'DELETE' }),
    pin: (id: string) => 
      apiFetch(`/notes/${id}/pin`, { method: 'PATCH' }),
  },

  // Games (Pocket Farm)
  games: {
    getProfile: () => apiFetch('/games/profile'),
    claimDaily: () => apiFetch('/games/claim-daily', { method: 'POST' }),
    plantCrop: (plotIndex: number, seedName: string) => 
      apiFetch('/games/farm/plant', { method: 'POST', body: JSON.stringify({ plotIndex, seedName }) }),
    waterCrop: (plotIndex: number) => 
      apiFetch('/games/farm/water', { method: 'POST', body: JSON.stringify({ plotIndex }) }),
    harvestCrop: (plotIndex: number) => 
      apiFetch('/games/farm/harvest', { method: 'POST', body: JSON.stringify({ plotIndex }) }),
    getAnimals: () => apiFetch('/games/animals'),
    buyAnimal: (animalName: string, name: string) => 
      apiFetch('/games/animals/buy', { method: 'POST', body: JSON.stringify({ animalName, name }) }),
    feedAnimal: (instanceId: string) => 
      apiFetch('/games/animals/feed', { method: 'POST', body: JSON.stringify({ instanceId }) }),
    collectAnimal: (instanceId: string) => 
      apiFetch('/games/animals/collect', { method: 'POST', body: JSON.stringify({ instanceId }) }),
    getFishing: () => apiFetch('/games/fishing'),
    catchFish: (locationId: number) => 
      apiFetch('/games/fishing/catch', { method: 'POST', body: JSON.stringify({ locationId }) }),
    enterCave: () => apiFetch('/games/cave/enter', { method: 'POST' }),
    fightMonster: (monsterId: number) => 
      apiFetch('/games/cave/fight', { method: 'POST', body: JSON.stringify({ monsterId }) }),
    getMarket: () => apiFetch('/games/marketplace'),
    listMarket: (itemName: string, price: number, qty: number) => 
      apiFetch('/games/marketplace/list', { method: 'POST', body: JSON.stringify({ itemName, price, qty }) }),
    buyMarket: (listingId: string) => 
      apiFetch('/games/marketplace/buy', { method: 'POST', body: JSON.stringify({ listingId }) }),
    cancelMarket: (listingId: string) => 
      apiFetch('/games/marketplace/cancel', { method: 'POST', body: JSON.stringify({ listingId }) }),
    getFriends: () => apiFetch('/games/friends'),
    visitFriend: (userId: string) => apiFetch(`/games/friends/visit/${userId}`),
  }
};
