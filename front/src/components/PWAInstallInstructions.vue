<template>
  <div class="pwa-install-instructions" v-if="showInstructions">
    <ion-card>
      <ion-card-header>
        <ion-card-title>
          <ion-icon :icon="downloadOutline"></ion-icon>
          Установить приложение
        </ion-card-title>
        <ion-card-subtitle>SmartGames PWA</ion-card-subtitle>
      </ion-card-header>
      
      <ion-card-content>
        <!-- iOS инструкции -->
        <div v-if="isIOS" class="install-steps">
          <h4>📱 Установка на iPhone/iPad:</h4>
          <ol>
            <li>Откройте сайт в <strong>Safari</strong></li>
            <li>Нажмите кнопку "Поделиться" <ion-icon :icon="shareOutline"></ion-icon></li>
            <li>Выберите "Добавить на главный экран"</li>
            <li>Введите название "SmartGames"</li>
            <li>Нажмите "Добавить"</li>
          </ol>
        </div>

        <!-- Android инструкции -->
        <div v-else-if="isAndroid" class="install-steps">
          <h4>🤖 Установка на Android:</h4>
          <ol>
            <li>Откройте сайт в <strong>Chrome</strong></li>
            <li>Нажмите меню (три точки) в правом верхнем углу</li>
            <li>Выберите "Добавить на главный экран"</li>
            <li>Подтвердите установку</li>
          </ol>
        </div>

        <!-- Desktop инструкции -->
        <div v-else class="install-steps">
          <h4>💻 Установка на компьютере:</h4>
          <ol>
            <li>Откройте сайт в <strong>Chrome/Edge</strong></li>
            <li>Нажмите на иконку установки в адресной строке</li>
            <li>Или используйте меню → "Установить приложение"</li>
          </ol>
        </div>

        <div class="benefits">
          <h4>✨ Преимущества установки:</h4>
          <ion-list>
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
          </ion-list>
        </div>

        <div class="actions">
          <ion-button expand="block" @click="hideInstructions">
            <ion-icon :icon="closeOutline" slot="start"></ion-icon>
            Понятно
          </ion-button>
        </div>
      </ion-card-content>
    </ion-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import {
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonIcon,
  IonList,
  IonItem,
  IonLabel,
  IonButton
} from '@ionic/vue';
import {
  downloadOutline,
  shareOutline,
  checkmarkCircleOutline,
  closeOutline
} from 'ionicons/icons';

const showInstructions = ref(false);

// Определяем платформу
const isIOS = computed(() => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
});

const isAndroid = computed(() => {
  return /Android/.test(navigator.userAgent);
});

// Проверяем, нужно ли показать инструкции
onMounted(() => {
  const hasSeenInstructions = localStorage.getItem('pwa-instructions-seen');
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  
  if (!hasSeenInstructions && !isStandalone) {
    showInstructions.value = true;
  }
});

const hideInstructions = () => {
  showInstructions.value = false;
  localStorage.setItem('pwa-instructions-seen', 'true');
};
</script>

<style scoped>
.pwa-install-instructions {
  position: fixed;
  top: 20px;
  left: 20px;
  right: 20px;
  z-index: 1000;
  max-width: 400px;
  margin: 0 auto;
}

.install-steps {
  margin: 16px 0;
}

.install-steps h4 {
  color: var(--ion-color-primary);
  margin-bottom: 12px;
}

.install-steps ol {
  padding-left: 20px;
}

.install-steps li {
  margin-bottom: 8px;
  line-height: 1.4;
}

.benefits {
  margin: 20px 0;
}

.benefits h4 {
  color: var(--ion-color-primary);
  margin-bottom: 12px;
}

.benefits ion-item {
  --padding-start: 0;
  --min-height: 32px;
}

.actions {
  margin-top: 20px;
}
</style>
