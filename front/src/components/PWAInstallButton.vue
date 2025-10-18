<template>
  <div class="pwa-install-button">
    <ion-button 
      v-if="showInstallButton"
      expand="block" 
      fill="outline"
      @click="showInstallInstructions"
    >
      <ion-icon :icon="downloadOutline" slot="start"></ion-icon>
      Установить как приложение
    </ion-button>

    <!-- Инструкции по установке -->
    <ion-modal :is-open="isInstructionsOpen" @did-dismiss="isInstructionsOpen = false">
      <ion-header>
        <ion-toolbar>
          <ion-title>Установка приложения</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="isInstructionsOpen = false">
              <ion-icon :icon="closeOutline"></ion-icon>
            </ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content class="ion-padding">
        
        <!-- Chrome/Edge -->
        <div v-if="isChrome || isEdge">
          <h3>Google Chrome / Microsoft Edge</h3>
          <ol>
            <li>Нажмите на иконку "Установить" в адресной строке</li>
            <li>Или используйте меню (три точки) → "Установить SmartGames PWA"</li>
            <li>Подтвердите установку</li>
          </ol>
        </div>

        <!-- Safari -->
        <div v-else-if="isSafari">
          <h3>Safari (iOS)</h3>
          <ol>
            <li>Нажмите кнопку "Поделиться" внизу экрана</li>
            <li>Выберите "На экран Домой"</li>
            <li>Нажмите "Добавить"</li>
          </ol>
        </div>

        <!-- Firefox -->
        <div v-else-if="isFirefox">
          <h3>Firefox</h3>
          <ol>
            <li>Нажмите на иконку "Дом" в адресной строке</li>
            <li>Выберите "Установить"</li>
            <li>Подтвердите установку</li>
          </ol>
        </div>

        <!-- Общие инструкции -->
        <div v-else>
          <h3>Общие инструкции</h3>
          <p>Для установки PWA приложения:</p>
          <ol>
            <li>Найдите опцию "Установить" или "Добавить на главный экран" в меню браузера</li>
            <li>Обычно это иконка с плюсом или стрелкой вниз в адресной строке</li>
            <li>Подтвердите установку</li>
          </ol>
        </div>

        <div class="install-benefits">
          <h4>Преимущества установки:</h4>
          <ion-item>
            <ion-icon :icon="checkmarkCircleOutline" color="success" slot="start"></ion-icon>
            <ion-label>Быстрый запуск с рабочего стола</ion-label>
          </ion-item>
          <ion-item>
            <ion-icon :icon="checkmarkCircleOutline" color="success" slot="start"></ion-icon>
            <ion-label>Работа в офлайн режиме</ion-label>
          </ion-item>
          <ion-item>
            <ion-icon :icon="checkmarkCircleOutline" color="success" slot="start"></ion-icon>
            <ion-label>Нативный интерфейс</ion-label>
          </ion-item>
          <ion-item>
            <ion-icon :icon="checkmarkCircleOutline" color="success" slot="start"></ion-icon>
            <ion-label>Автоматические обновления</ion-label>
          </ion-item>
        </div>

        <ion-button 
          expand="block" 
          @click="isInstructionsOpen = false"
          class="ion-margin-top"
        >
          Понятно
        </ion-button>
      </ion-content>
    </ion-modal>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted } from 'vue';
import { 
  IonButton,
  IonIcon,
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonContent,
  IonItem,
  IonLabel
} from '@ionic/vue';
import { 
  downloadOutline,
  closeOutline,
  checkmarkCircleOutline
} from 'ionicons/icons';

export default defineComponent({
  name: 'PWAInstallButton',
  components: {
    IonButton,
    IonIcon,
    IonModal,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonContent,
    IonItem,
    IonLabel
  },
  setup() {
    const showInstallButton = ref(false);
    const isInstructionsOpen = ref(false);

    // Определяем браузер
    const userAgent = navigator.userAgent.toLowerCase();
    const isChrome = computed(() => userAgent.includes('chrome') && !userAgent.includes('edg'));
    const isEdge = computed(() => userAgent.includes('edg'));
    const isSafari = computed(() => userAgent.includes('safari') && !userAgent.includes('chrome'));
    const isFirefox = computed(() => userAgent.includes('firefox'));

    const showInstallInstructions = () => {
      isInstructionsOpen.value = true;
    };

    const checkInstallability = () => {
      // Проверяем, установлено ли уже приложение
      const isInstalled = window.matchMedia('(display-mode: standalone)').matches || 
                         (window.navigator as any).standalone === true;

      if (!isInstalled) {
        showInstallButton.value = true;
      }
    };

    onMounted(() => {
      // Проверяем через небольшую задержку
      setTimeout(checkInstallability, 1000);
    });

    return {
      showInstallButton,
      isInstructionsOpen,
      isChrome,
      isEdge,
      isSafari,
      isFirefox,
      showInstallInstructions,
      downloadOutline,
      closeOutline,
      checkmarkCircleOutline
    };
  }
});
</script>

<style scoped>
.pwa-install-button {
  margin: 16px 0;
}

.install-benefits {
  margin-top: 20px;
}

.install-benefits ion-item {
  --padding-start: 0;
  --min-height: 40px;
}

.install-benefits h4 {
  margin-bottom: 12px;
  color: var(--ion-color-primary);
}

ol {
  padding-left: 20px;
}

ol li {
  margin-bottom: 8px;
  line-height: 1.4;
}
</style>
