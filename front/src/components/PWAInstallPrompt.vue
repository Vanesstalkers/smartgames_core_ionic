<template>
  <div class="pwa-install-prompt" v-if="showInstallPrompt">
    <ion-card>
      <ion-card-header>
        <ion-card-title>
          <ion-icon :icon="downloadOutline" class="install-icon"></ion-icon>
          Установить приложение
        </ion-card-title>
        <ion-card-subtitle>SmartGames PWA</ion-card-subtitle>
      </ion-card-header>
      <ion-card-content>
        <p>Установите SmartGames как приложение для быстрого доступа и работы в офлайн режиме.</p>
        
        <div class="install-benefits">
          <ion-item>
            <ion-icon :icon="checkmarkCircleOutline" color="success" slot="start"></ion-icon>
            <ion-label>Быстрый запуск</ion-label>
          </ion-item>
          <ion-item>
            <ion-icon :icon="checkmarkCircleOutline" color="success" slot="start"></ion-icon>
            <ion-label>Работа в офлайн</ion-label>
          </ion-item>
          <ion-item>
            <ion-icon :icon="checkmarkCircleOutline" color="success" slot="start"></ion-icon>
            <ion-label>Уведомления</ion-label>
          </ion-item>
          <ion-item>
            <ion-icon :icon="checkmarkCircleOutline" color="success" slot="start"></ion-icon>
            <ion-label>Нативный интерфейс</ion-label>
          </ion-item>
        </div>

        <div class="install-actions">
          <ion-button 
            expand="block" 
            @click="installApp"
            :disabled="!canInstall"
          >
            <ion-icon :icon="downloadOutline" slot="start"></ion-icon>
            Установить
          </ion-button>
          
          <ion-button 
            expand="block" 
            fill="outline" 
            @click="dismissPrompt"
          >
            <ion-icon :icon="closeOutline" slot="start"></ion-icon>
            Не сейчас
          </ion-button>
        </div>
      </ion-card-content>
    </ion-card>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, onUnmounted } from 'vue';
import { 
  IonCard, 
  IonCardHeader, 
  IonCardTitle, 
  IonCardSubtitle,
  IonCardContent,
  IonItem, 
  IonIcon, 
  IonLabel,
  IonButton
} from '@ionic/vue';
import { 
  downloadOutline,
  checkmarkCircleOutline,
  closeOutline
} from 'ionicons/icons';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default defineComponent({
  name: 'PWAInstallPrompt',
  components: {
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonItem,
    IonIcon,
    IonLabel,
    IonButton
  },
  setup() {
    const showInstallPrompt = ref(false);
    const canInstall = ref(false);
    const deferredPrompt = ref<BeforeInstallPromptEvent | null>(null);

    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('🚀 PWA install prompt event received');
      e.preventDefault();
      deferredPrompt.value = e as BeforeInstallPromptEvent;
      canInstall.value = true;
      
      // Показываем промпт только если пользователь еще не видел его
      const hasSeenPrompt = localStorage.getItem('pwa-install-prompt-seen');
      if (!hasSeenPrompt) {
        showInstallPrompt.value = true;
      }
    };

    const handleAppInstalled = () => {
      console.log('✅ PWA was installed');
      showInstallPrompt.value = false;
      canInstall.value = false;
      deferredPrompt.value = null;
      
      // Показываем уведомление об успешной установке
      setTimeout(() => {
        alert('Приложение успешно установлено! Теперь вы можете запускать SmartGames как нативное приложение.');
      }, 1000);
    };

    const installApp = async () => {
      if (!deferredPrompt.value) {
        console.log('❌ No install prompt available');
        return;
      }

      try {
        console.log('📱 Showing install prompt...');
        await deferredPrompt.value.prompt();
        
        const choiceResult = await deferredPrompt.value.userChoice;
        console.log('User choice:', choiceResult.outcome);
        
        if (choiceResult.outcome === 'accepted') {
          console.log('✅ User accepted the install prompt');
        } else {
          console.log('❌ User dismissed the install prompt');
        }
        
        showInstallPrompt.value = false;
        deferredPrompt.value = null;
        
      } catch (error) {
        console.error('Error showing install prompt:', error);
      }
    };

    const dismissPrompt = () => {
      showInstallPrompt.value = false;
      
      // Запоминаем, что пользователь видел промпт
      localStorage.setItem('pwa-install-prompt-seen', 'true');
      
      // Показываем снова через 7 дней
      const nextShowTime = Date.now() + (7 * 24 * 60 * 60 * 1000);
      localStorage.setItem('pwa-install-prompt-next', nextShowTime.toString());
    };

    const checkInstallability = () => {
      // Проверяем, можно ли показать промпт
      const hasSeenPrompt = localStorage.getItem('pwa-install-prompt-seen');
      const nextShowTime = localStorage.getItem('pwa-install-prompt-next');
      
      if (hasSeenPrompt && nextShowTime) {
        const nextTime = parseInt(nextShowTime);
        if (Date.now() < nextTime) {
          console.log('⏰ Install prompt was dismissed, waiting...');
          return;
        }
      }

      // Проверяем, установлено ли уже приложение
      if (window.matchMedia('(display-mode: standalone)').matches || 
          (window.navigator as any).standalone === true) {
        console.log('📱 App is already installed');
        return;
      }

      // Если есть deferred prompt, показываем промпт
      if (deferredPrompt.value && !hasSeenPrompt) {
        showInstallPrompt.value = true;
      }
    };

    onMounted(() => {
      // Слушаем событие beforeinstallprompt
      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      
      // Слушаем событие appinstalled
      window.addEventListener('appinstalled', handleAppInstalled);
      
      // Проверяем установленность через небольшую задержку
      setTimeout(checkInstallability, 2000);
    });

    onUnmounted(() => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    });

    return {
      showInstallPrompt,
      canInstall,
      installApp,
      dismissPrompt,
      downloadOutline,
      checkmarkCircleOutline,
      closeOutline
    };
  }
});
</script>

<style scoped>
.pwa-install-prompt {
  position: fixed;
  bottom: 20px;
  left: 20px;
  right: 20px;
  z-index: 1000;
  max-width: 400px;
  margin: 0 auto;
}

.pwa-install-prompt ion-card {
  margin: 0;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.install-icon {
  margin-right: 8px;
  vertical-align: middle;
}

.install-benefits {
  margin: 16px 0;
}

.install-benefits ion-item {
  --padding-start: 0;
  --min-height: 32px;
}

.install-actions {
  margin-top: 20px;
}

.install-actions ion-button {
  margin-top: 10px;
}

.install-actions ion-button:first-child {
  margin-top: 0;
}
</style>
