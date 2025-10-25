<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Настройки</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Настройки приложения</ion-title>
        </ion-toolbar>
      </ion-header>

      <!-- PWA компоненты -->
      <PWAInstallPrompt />
      <PWAStatus />
      <PWAInstallInstructions />

      <!-- Управление балансом -->
      <ion-card>
        <ion-card-header>
          <ion-card-title>Финансы</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <ion-list>
            <ion-item>
              <ion-icon :icon="wallet" slot="start" color="primary"></ion-icon>
              <ion-label>
                <h2>Текущий баланс</h2>
                <p>{{ formatCurrency(userProfile.balance) }}</p>
              </ion-label>
              <ion-button slot="end" fill="outline" size="small" @click="openTopUpModal">
                Пополнить
              </ion-button>
            </ion-item>
          </ion-list>
        </ion-card-content>
      </ion-card>

      <!-- Настройки уведомлений -->
      <ion-card>
        <ion-card-header>
          <ion-card-title>Уведомления</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <ion-list>
            <ion-item>
              <ion-icon :icon="notifications" slot="start"></ion-icon>
              <ion-label>Включить уведомления</ion-label>
              <ion-toggle slot="end" :checked="notificationsEnabled" @ion-change="toggleNotifications"></ion-toggle>
            </ion-item>
            <ion-item>
              <ion-icon :icon="time" slot="start"></ion-icon>
              <ion-label>Время напоминания</ion-label>
              <ion-select slot="end" :value="reminderTime" @ion-change="changeReminderTime">
                <ion-select-option value="09:00">09:00</ion-select-option>
                <ion-select-option value="12:00">12:00</ion-select-option>
                <ion-select-option value="18:00">18:00</ion-select-option>
                <ion-select-option value="20:00">20:00</ion-select-option>
              </ion-select>
            </ion-item>
          </ion-list>
        </ion-card-content>
      </ion-card>

      <!-- Категории событий -->
      <ion-card>
        <ion-card-header>
          <ion-card-title>Категории</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <ion-list>
            <ion-item v-for="category in categories" :key="category.id">
              <ion-icon :icon="category.icon" slot="start" :color="category.color"></ion-icon>
              <ion-label>{{ category.name }}</ion-label>
              <ion-button slot="end" fill="clear" size="small" @click="editCategory(category.id)">
                <ion-icon :icon="createOutline"></ion-icon>
              </ion-button>
            </ion-item>
            <ion-item button @click="addCategory">
              <ion-icon :icon="add" slot="start" color="primary"></ion-icon>
              <ion-label>Добавить категорию</ion-label>
            </ion-item>
          </ion-list>
        </ion-card-content>
      </ion-card>

      <!-- Резервное копирование -->
      <ion-card>
        <ion-card-header>
          <ion-card-title>Данные</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <ion-list>
            <ion-item button @click="exportData">
              <ion-icon :icon="download" slot="start"></ion-icon>
              <ion-label>Экспорт данных</ion-label>
            </ion-item>
            <ion-item button @click="importData">
              <ion-icon :icon="cloudUploadOutline" slot="start"></ion-icon>
              <ion-label>Импорт данных</ion-label>
            </ion-item>
            <ion-item button @click="clearAllData" color="danger">
              <ion-icon :icon="trash" slot="start"></ion-icon>
              <ion-label>Очистить все данные</ion-label>
            </ion-item>
          </ion-list>
        </ion-card-content>
      </ion-card>

      <!-- О приложении -->
      <ion-card>
        <ion-card-header>
          <ion-card-title>О приложении</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <ion-list>
            <ion-item>
              <ion-label>
                <h2>Памятные даты</h2>
                <p>Версия 1.0.0</p>
              </ion-label>
            </ion-item>
            <ion-item button @click="openPrivacyPolicy">
              <ion-icon :icon="document" slot="start"></ion-icon>
              <ion-label>Политика конфиденциальности</ion-label>
            </ion-item>
            <ion-item button @click="openTerms">
              <ion-icon :icon="documentText" slot="start"></ion-icon>
              <ion-label>Условия использования</ion-label>
            </ion-item>
          </ion-list>
        </ion-card-content>
      </ion-card>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonList,
  IonItem,
  IonLabel,
  IonIcon,
  IonToggle,
  IonSelect,
  IonSelectOption,
  IonButton
} from '@ionic/vue';
import {
  notifications,
  time,
  createOutline,
  add,
  download,
  cloudUploadOutline,
  trash,
  document,
  documentText,
  heart,
  people,
  business,
  star,
  home,
  wallet
} from 'ionicons/icons';
import userStore from '@/store/user';
import PWAInstallPrompt from '@/components/PWAInstallPrompt.vue';
import PWAStatus from '@/components/PWAStatus.vue';
import PWAInstallInstructions from '@/components/PWAInstallInstructions.vue';

// Состояние настроек
const notificationsEnabled = ref(true);
const reminderTime = ref('09:00');

// Импорт userStore
const { userProfile, formatCurrency } = userStore;

// Категории событий
const categories = ref([
  { id: 1, name: 'Семья', icon: heart, color: 'danger' },
  { id: 2, name: 'Друзья', icon: people, color: 'secondary' },
  { id: 3, name: 'Работа', icon: business, color: 'tertiary' },
  { id: 4, name: 'Память', icon: star, color: 'medium' },
  { id: 5, name: 'Праздник', icon: star, color: 'success' },
  { id: 6, name: 'Другое', icon: home, color: 'warning' }
]);

// Методы
const toggleNotifications = (event: CustomEvent) => {
  notificationsEnabled.value = event.detail.checked;
  console.log('Уведомления:', notificationsEnabled.value ? 'включены' : 'выключены');
};

const changeReminderTime = (event: CustomEvent) => {
  reminderTime.value = event.detail.value;
  console.log('Время напоминания изменено на:', reminderTime.value);
};

const editCategory = (categoryId: number) => {
  console.log('Редактировать категорию:', categoryId);
  alert(`Редактировать категорию с ID: ${categoryId}`);
};

const addCategory = () => {
  console.log('Добавить новую категорию');
  alert('Функция добавления категории будет реализована позже');
};

const exportData = () => {
  console.log('Экспорт данных');
  alert('Функция экспорта данных будет реализована позже');
};

const importData = () => {
  console.log('Импорт данных');
  alert('Функция импорта данных будет реализована позже');
};

const clearAllData = () => {
  if (confirm('Вы уверены, что хотите удалить все данные? Это действие нельзя отменить.')) {
    console.log('Очистить все данные');
    alert('Все данные удалены');
  }
};

const openPrivacyPolicy = () => {
  console.log('Открыть политику конфиденциальности');
  alert('Политика конфиденциальности будет добавлена позже');
};

const openTerms = () => {
  console.log('Открыть условия использования');
  alert('Условия использования будут добавлены позже');
};

const openTopUpModal = () => {
  // Простое пополнение через prompt
  const amount = prompt('Введите сумму для пополнения:');
  if (amount && !isNaN(Number(amount)) && Number(amount) > 0) {
    userStore.addToBalance(Number(amount));
    alert(`Счет пополнен на ${formatCurrency(Number(amount))}`);
  }
};
</script>

<style scoped>
ion-card {
  margin: 16px;
}

ion-list {
  padding: 0;
}
</style>
