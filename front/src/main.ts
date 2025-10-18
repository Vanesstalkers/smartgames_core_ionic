import { createApp } from 'vue'
import App from './App.vue'
import router from './router';

import { IonicVue } from '@ionic/vue';

// PWA
// import { registerSW } from 'virtual:pwa-register'

/* Core CSS required for Ionic components to work properly */
import '@ionic/vue/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/vue/css/normalize.css';
import '@ionic/vue/css/structure.css';
import '@ionic/vue/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/vue/css/padding.css';
import '@ionic/vue/css/float-elements.css';
import '@ionic/vue/css/text-alignment.css';
import '@ionic/vue/css/text-transformation.css';
import '@ionic/vue/css/flex-utils.css';
import '@ionic/vue/css/display.css';

/**
 * Ionic Dark Mode
 * -----------------------------------------------------
 * For more info, please see:
 * https://ionicframework.com/docs/theming/dark-mode
 */

/* @import '@ionic/vue/css/palettes/dark.always.css'; */
/* @import '@ionic/vue/css/palettes/dark.class.css'; */
import '@ionic/vue/css/palettes/dark.system.css';

/* Theme variables */
import './theme/variables.css';

const app = createApp(App)
  .use(IonicVue)
  .use(router);

router.isReady().then(() => {
  app.mount('#app');
});

// PWA Service Worker registration
/*
if ('serviceWorker' in navigator) {
  console.log('🚀 Начинаем регистрацию Service Worker...');
  
  registerSW({
    onNeedRefresh() {
      console.log('🔄 Новое содержимое доступно, обновление рекомендуется');
      showUpdateNotification();
    },
    onOfflineReady() {
      console.log('📱 Приложение готово к работе в офлайн режиме');
      showOfflineReadyNotification();
    },
    onRegistered(registration: ServiceWorkerRegistration | undefined) {
      if (registration) {
        console.log('✅ Service Worker зарегистрирован:', registration);
        console.log('SW scope:', registration.scope);
        console.log('SW state:', registration.active?.state);
      } else {
        console.log('⚠️ Service Worker registration вернул undefined');
      }
    },
    onRegisterError(error: Error) {
      console.error('❌ Ошибка регистрации Service Worker:', error);
      console.error('Детали ошибки:', error.message, error.stack);
    }
  });
  
  // Дополнительная проверка через 2 секунды
  setTimeout(() => {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      console.log('🔍 Проверка через 2 сек - регистраций SW:', registrations.length);
      if (registrations.length === 0) {
        console.log('⚠️ Service Worker не зарегистрирован. Возможные причины:');
        console.log('1. Режим разработки - SW может не работать в dev режиме');
        console.log('2. Нужна сборка проекта: npm run build');
        console.log('3. Требуется HTTPS (кроме localhost)');
      }
    });
  }, 2000);
} else {
  console.log('❌ Service Worker не поддерживается в этом браузере');
}

// Функция показа уведомления об обновлении
function showUpdateNotification() {
  // Простое уведомление в консоли, можно заменить на toast или modal
  if (confirm('Доступно обновление приложения. Обновить сейчас?')) {
    window.location.reload();
  }
}

// Функция показа уведомления о готовности к офлайн работе
function showOfflineReadyNotification() {
  console.log('🚀 Приложение готово к работе без интернета!');
  // Можно показать toast уведомление
}
*/
