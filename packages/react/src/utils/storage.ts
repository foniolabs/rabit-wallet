export function getStorageItem(key: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.warn(`Failed to get localStorage item "${key}":`, error);
    return null;
  }
}

export function setStorageItem(key: string, value: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.warn(`Failed to set localStorage item "${key}":`, error);
  }
}

export function removeStorageItem(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.warn(`Failed to remove localStorage item "${key}":`, error);
  }
}

export function getStorageObject<T>(key: string): T | null {
  const item = getStorageItem(key);
  if (!item) return null;
  
  try {
    return JSON.parse(item) as T;
  } catch (error) {
    console.warn(`Failed to parse localStorage item "${key}":`, error);
    return null;
  }
}

export function setStorageObject<T>(key: string, value: T): void {
  try {
    const serialized = JSON.stringify(value);
    setStorageItem(key, serialized);
  } catch (error) {
    console.warn(`Failed to serialize and store object "${key}":`, error);
  }
}
