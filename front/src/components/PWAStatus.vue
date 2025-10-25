<template>
  <div class="pwa-status">
    <ion-card v-if="showStatus">
      <ion-card-header>
        <ion-card-title>PWA Статус</ion-card-title>
      </ion-card-header>
      <ion-card-content>
        <!-- Статус подключения -->
        <ion-item>
          <ion-icon :icon="connectionIcon" :color="connectionColor" slot="start"></ion-icon>
          <ion-label>
            <h3>Подключение</h3>
            <p>{{ connectionStatus }}</p>
          </ion-label>
        </ion-item>

        <!-- Статус Service Worker -->
        <ion-item>
          <ion-icon :icon="swIcon" :color="swColor" slot="start"></ion-icon>
          <ion-label>
            <h3>Service Worker</h3>
            <p>{{ swStatus }}</p>
          </ion-label>
        </ion-item>

        <!-- Информация о кеше -->
        <ion-item v-if="cacheInfo.length > 0">
          <ion-icon :icon="checkmarkCircleOutline" slot="start"></ion-icon>
          <ion-label>
            <h3>Кеш</h3>
            <p>{{ cacheSummary }}</p>
          </ion-label>
        </ion-item>

        <!-- Кнопки управления -->
        <ion-button 
          expand="block" 
          fill="outline" 
          @click="refreshCache"
          :disabled="isLoading"
        >
          <ion-icon :icon="checkmarkCircleOutline" slot="start"></ion-icon>
          Обновить кеш
        </ion-button>

        <ion-button 
          expand="block" 
          fill="outline" 
          color="danger"
          @click="clearCache"
          :disabled="isLoading"
        >
          <ion-icon :icon="closeCircleOutline" slot="start"></ion-icon>
          Очистить кеш
        </ion-button>
      </ion-card-content>
    </ion-card>

    <!-- Кнопка показа/скрытия статуса -->
    <ion-fab-button 
      @click="toggleStatus"
      class="pwa-status-fab"
      style="display: none;"
    >
      <ion-icon :icon="showStatus ? closeCircleOutline : checkmarkCircleOutline"></ion-icon>
    </ion-fab-button>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, onUnmounted } from 'vue';
import { 
  IonCard, 
  IonCardHeader, 
  IonCardTitle, 
  IonCardContent,
  IonItem, 
  IonIcon, 
  IonLabel,
  IonButton,
  IonFabButton
} from '@ionic/vue';
import { 
  wifiOutline, 
  checkmarkCircleOutline,
  closeCircleOutline
} from 'ionicons/icons';
import { 
  getCacheInfo, 
  clearAllCaches, 
  isOffline, 
  onConnectionChange,
  formatCacheSize,
  checkPWASupport
} from '../utils/pwa-utils';

export default defineComponent({
  name: 'PWAStatus',
  components: {
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonItem,
    IonIcon,
    IonLabel,
    IonButton,
    IonFabButton
  },
  setup() {
    // Reactive data
    const showStatus = ref(false);
    const isLoading = ref(false);
    const isOnline = ref(!isOffline());
    const swRegistered = ref(false);
    const cacheInfo = ref<Array<{name: string, size: number, entries: number}>>([]);

    // Computed properties
    const connectionIcon = computed(() => isOnline.value ? wifiOutline : closeCircleOutline);
    const connectionColor = computed(() => isOnline.value ? 'success' : 'danger');
    const connectionStatus = computed(() => isOnline.value ? 'Онлайн' : 'Офлайн');

    const swIcon = computed(() => swRegistered.value ? checkmarkCircleOutline : closeCircleOutline);
    const swColor = computed(() => swRegistered.value ? 'success' : 'danger');
    const swStatus = computed(() => swRegistered.value ? 'Активен' : 'Неактивен');

    const cacheSummary = computed(() => {
      if (cacheInfo.value.length === 0) return 'Нет данных';
      
      const totalSize = cacheInfo.value.reduce((sum, cache) => sum + cache.size, 0);
      const totalEntries = cacheInfo.value.reduce((sum, cache) => sum + cache.entries, 0);
      
      return `${formatCacheSize(totalSize)} (${totalEntries} записей)`;
    });

    // Methods
    const toggleStatus = () => {
      showStatus.value = !showStatus.value;
    };

    const refreshCache = async () => {
      isLoading.value = true;
      try {
        await loadCacheInfo();
        // Принудительно обновляем Service Worker
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
        }
      } catch (error) {
        console.error('Ошибка при обновлении кеша:', error);
      } finally {
        isLoading.value = false;
      }
    };

    const clearCache = async () => {
      isLoading.value = true;
      try {
        await clearAllCaches();
        await loadCacheInfo();
        console.log('Кеш очищен');
      } catch (error) {
        console.error('Ошибка при очистке кеша:', error);
      } finally {
        isLoading.value = false;
      }
    };

    const loadCacheInfo = async () => {
      try {
        cacheInfo.value = await getCacheInfo();
      } catch (error) {
        console.error('Ошибка при загрузке информации о кеше:', error);
      }
    };

    const checkSWStatus = () => {
      if ('serviceWorker' in navigator) {
        console.log('Service Worker поддерживается');
        
        navigator.serviceWorker.getRegistrations().then(registrations => {
          console.log('Количество регистраций SW:', registrations.length);
          swRegistered.value = registrations.length > 0;
          
          if (registrations.length > 0) {
            console.log('SW registrations:', registrations);
            registrations.forEach((reg, index) => {
              console.log(`SW ${index}:`, {
                scope: reg.scope,
                state: reg.active?.state,
                scriptURL: reg.active?.scriptURL
              });
            });
          }
        });
        
        // Также проверим активный Service Worker
        if (navigator.serviceWorker.controller) {
          swRegistered.value = true;
          console.log('Active SW controller:', navigator.serviceWorker.controller);
        } else {
          console.log('Нет активного SW controller');
        }
        
        // Слушаем изменения состояния
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          console.log('SW controller изменился');
          swRegistered.value = !!navigator.serviceWorker.controller;
        });
      } else {
        console.log('Service Worker НЕ поддерживается в этом браузере');
      }
    };

    // Lifecycle
    let unsubscribeConnection: (() => void) | null = null;

    onMounted(async () => {
      // Проверяем поддержку PWA
      const support = checkPWASupport();
      console.log('PWA поддержка:', support);
      
      // Загружаем информацию о кеше
      await loadCacheInfo();
      
      // Проверяем статус Service Worker
      checkSWStatus();
      
      // Дополнительная проверка через небольшую задержку
      setTimeout(() => {
        checkSWStatus();
      }, 1000);
      
      // Подписываемся на изменения подключения
      unsubscribeConnection = onConnectionChange((online) => {
        isOnline.value = online;
        console.log('Статус подключения изменился:', online ? 'Онлайн' : 'Офлайн');
      });
    });

    onUnmounted(() => {
      if (unsubscribeConnection) {
        unsubscribeConnection();
      }
    });

    return {
      showStatus,
      isLoading,
      isOnline,
      swRegistered,
      cacheInfo,
      connectionIcon,
      connectionColor,
      connectionStatus,
      swIcon,
      swColor,
      swStatus,
      cacheSummary,
      toggleStatus,
      refreshCache,
      clearCache,
      checkmarkCircleOutline,
      closeCircleOutline
    };
  }
});
</script>

<style scoped>
.pwa-status {
  position: relative;
}

.pwa-status-fab {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
}

.pwa-status ion-card {
  margin: 10px;
  max-width: 400px;
}

.pwa-status ion-item {
  --padding-start: 0;
}

.pwa-status ion-button {
  margin-top: 10px;
}
</style>
