// PWA Utilities для управления кешем и офлайн функциональностью

export interface CacheInfo {
  name: string;
  size: number;
  entries: number;
}

/**
 * Получить информацию о кешах
 */
export async function getCacheInfo(): Promise<CacheInfo[]> {
  if (!('caches' in window)) {
    return [];
  }

  const cacheNames = await caches.keys();
  const cacheInfo: CacheInfo[] = [];

  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    let totalSize = 0;

    for (const request of keys) {
      const response = await cache.match(request);
      if (response) {
        const blob = await response.blob();
        totalSize += blob.size;
      }
    }

    cacheInfo.push({
      name: cacheName,
      size: totalSize,
      entries: keys.length
    });
  }

  return cacheInfo;
}

/**
 * Очистить все кеши
 */
export async function clearAllCaches(): Promise<void> {
  if (!('caches' in window)) {
    return;
  }

  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)));
}

/**
 * Очистить конкретный кеш
 */
export async function clearCache(cacheName: string): Promise<void> {
  if (!('caches' in window)) {
    return;
  }

  await caches.delete(cacheName);
}

/**
 * Проверить, работает ли приложение в офлайн режиме
 */
export function isOffline(): boolean {
  return !navigator.onLine;
}

/**
 * Подписаться на изменения статуса подключения
 */
export function onConnectionChange(callback: (isOnline: boolean) => void): () => void {
  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Возвращаем функцию для отписки
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}

/**
 * Показать уведомление о статусе подключения
 */
export function showConnectionStatus(): void {
  const status = isOffline() ? '🔴 Офлайн' : '🟢 Онлайн';
  console.log(`Статус подключения: ${status}`);
}

/**
 * Получить размер кеша в читаемом формате
 */
export function formatCacheSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

/**
 * Проверить, поддерживает ли браузер PWA функции
 */
export function checkPWASupport(): {
  serviceWorker: boolean;
  pushManager: boolean;
  notifications: boolean;
  cache: boolean;
} {
  return {
    serviceWorker: 'serviceWorker' in navigator,
    pushManager: 'PushManager' in window,
    notifications: 'Notification' in window,
    cache: 'caches' in window
  };
}

/**
 * Запросить разрешение на уведомления
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    throw new Error('Уведомления не поддерживаются в этом браузере');
  }

  if (Notification.permission === 'default') {
    return await Notification.requestPermission();
  }

  return Notification.permission;
}

/**
 * Показать уведомление
 */
export function showNotification(title: string, options?: NotificationOptions): void {
  if (Notification.permission === 'granted') {
    new Notification(title, options);
  } else {
    console.warn('Нет разрешения на показ уведомлений');
  }
}
