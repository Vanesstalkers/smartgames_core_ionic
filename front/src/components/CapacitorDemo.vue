<template>
  <div class="capacitor-demo">
    <ion-card>
      <ion-card-header>
        <ion-card-title>Capacitor Demo</ion-card-title>
        <ion-card-subtitle>Тестирование нативных функций</ion-card-subtitle>
      </ion-card-header>
      <ion-card-content>
        
        <!-- App Info -->
        <ion-item>
          <ion-icon :icon="informationCircleOutline" slot="start"></ion-icon>
          <ion-label>
            <h3>Информация о приложении</h3>
            <p>{{ appInfo }}</p>
          </ion-label>
        </ion-item>

        <!-- Platform Info -->
        <ion-item>
          <ion-icon :icon="phonePortraitOutline" slot="start"></ion-icon>
          <ion-label>
            <h3>Платформа</h3>
            <p>{{ platformInfo }}</p>
          </ion-label>
        </ion-item>

        <!-- Network Status -->
        <ion-item>
          <ion-icon :icon="wifiOutline" slot="start"></ion-icon>
          <ion-label>
            <h3>Сетевое подключение</h3>
            <p>{{ networkStatus }}</p>
          </ion-label>
        </ion-item>

        <!-- Buttons -->
        <ion-button 
          expand="block" 
          @click="showAlert"
          :disabled="!isNative"
        >
          <ion-icon :icon="alertCircleOutline" slot="start"></ion-icon>
          Показать Alert
        </ion-button>

        <ion-button 
          expand="block" 
          @click="vibrate"
          :disabled="!isNative"
          fill="outline"
        >
          <ion-icon :icon="pulseOutline" slot="start"></ion-icon>
          Вибрация
        </ion-button>

        <ion-button 
          expand="block" 
          @click="checkAppState"
          :disabled="!isNative"
          fill="outline"
        >
          <ion-icon :icon="checkmarkCircleOutline" slot="start"></ion-icon>
          Проверить состояние
        </ion-button>

        <ion-button 
          expand="block" 
          @click="openUrl"
          fill="outline"
        >
          <ion-icon :icon="openOutline" slot="start"></ion-icon>
          Открыть URL
        </ion-button>

      </ion-card-content>
    </ion-card>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue';
import { 
  IonCard, 
  IonCardHeader, 
  IonCardTitle, 
  IonCardSubtitle,
  IonCardContent,
  IonItem, 
  IonIcon, 
  IonLabel,
  IonButton,
  alertController
} from '@ionic/vue';
import { 
  informationCircleOutline,
  phonePortraitOutline,
  wifiOutline,
  alertCircleOutline,
  pulseOutline,
  checkmarkCircleOutline,
  openOutline
} from 'ionicons/icons';

export default defineComponent({
  name: 'CapacitorDemo',
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
    const appInfo = ref('Загрузка...');
    const platformInfo = ref('Загрузка...');
    const networkStatus = ref('Загрузка...');
    const isNative = ref(false);

    const loadAppInfo = async () => {
      try {
        const { App } = await import('@capacitor/app');
        const { Device } = await import('@capacitor/device');
        const { Network } = await import('@capacitor/network');
        
        // App Info
        const appState = await App.getState();
        appInfo.value = `SmartGames PWA v1.0.0 (Active: ${appState.isActive})`;
        
        // Platform Info
        const deviceInfo = await Device.getInfo();
        platformInfo.value = `${deviceInfo.platform} ${deviceInfo.model}`;
        isNative.value = deviceInfo.platform !== 'web';
        
        // Network Status
        const networkState = await Network.getStatus();
        networkStatus.value = networkState.connected ? 'Подключено' : 'Отключено';
        
      } catch (error) {
        console.log('Capacitor не доступен (веб-режим)');
        appInfo.value = 'Веб-приложение';
        platformInfo.value = 'Веб-браузер';
        networkStatus.value = navigator.onLine ? 'Подключено' : 'Отключено';
        isNative.value = false;
      }
    };

    const showAlert = async () => {    
      const alert = await alertController.create({
        header: 'Capacitor Alert',
        message: 'Это нативный alert от Capacitor!',
        buttons: ['OK']
      });
      
      await alert.present();
    };

    const vibrate = async () => {
      try {
        const { Haptics } = await import('@capacitor/haptics');
        await Haptics.vibrate({ duration: 1000 });
      } catch (error) {
        console.log('Вибрация не поддерживается');
      }
    };

    const checkAppState = async () => {
      try {
        const { App } = await import('@capacitor/app');
        const state = await App.getState();
        console.log('App State:', state);
        
        const alert = await alertController.create({
          header: 'Состояние приложения',
          message: `Активно: ${state.isActive}\nВ фоне: ${state.isActive === false}`,
          buttons: ['OK']
        });
        
        await alert.present();
      } catch (error) {
        console.log('Ошибка получения состояния приложения:', error);
      }
    };

    const openUrl = async () => {
      try {
        const { Browser } = await import('@capacitor/browser');
        await Browser.open({ url: 'https://ionicframework.com' });
      } catch (error) {
        // Fallback для веб-режима
        window.open('https://ionicframework.com', '_blank');
      }
    };

    onMounted(() => {
      loadAppInfo();
    });

    return {
      appInfo,
      platformInfo,
      networkStatus,
      isNative,
      showAlert,
      vibrate,
      checkAppState,
      openUrl,
      informationCircleOutline,
      phonePortraitOutline,
      wifiOutline,
      alertCircleOutline,
      pulseOutline,
      checkmarkCircleOutline,
      openOutline
    };
  }
});
</script>

<style scoped>
.capacitor-demo ion-card {
  margin: 10px;
}

.capacitor-demo ion-button {
  margin-top: 10px;
}
</style>
