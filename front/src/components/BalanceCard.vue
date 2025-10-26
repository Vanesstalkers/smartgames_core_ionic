<template>
  <ion-card>
    <ion-card-header>
      <div class="card-header-content">
        <ion-card-title>Баланс</ion-card-title>
        <ion-button 
          size="small" 
          @click="openTopUpModal"
          class="top-up-button"
        >
          Пополнить
        </ion-button>
      </div>
    </ion-card-header>
    <ion-card-content>
      <div class="balance-display">
        <div class="balance-amount">
          <ion-icon :icon="wallet" color="primary"></ion-icon>
          <span class="amount">{{ formatCurrency(userProfile.balance) }}</span>
        </div>
      </div>
    </ion-card-content>
  </ion-card>

  <!-- Модальное окно пополнения -->
  <ion-modal :is-open="isTopUpModalOpen" @did-dismiss="closeTopUpModal">
    <ion-header>
      <ion-toolbar>
        <ion-title>Пополнение счета</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="closeTopUpModal">
            <ion-icon :icon="close"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <div class="top-up-form">
        <ion-item>
          <ion-label position="stacked">Сумма пополнения *</ion-label>
          <ion-input 
            v-model="topUpAmount" 
            type="number" 
            placeholder="Введите сумму"
            :min="1"
            required
          ></ion-input>
        </ion-item>
        
        <ion-item>
          <ion-label position="stacked">Способ пополнения</ion-label>
          <ion-select v-model="paymentMethod" placeholder="Выберите способ">
            <ion-select-option value="card">Банковская карта</ion-select-option>
            <ion-select-option value="wallet">Электронный кошелек</ion-select-option>
            <ion-select-option value="cash">Наличные</ion-select-option>
          </ion-select>
        </ion-item>

        <div class="quick-amounts">
          <ion-chip 
            v-for="amount in quickAmounts" 
            :key="amount"
            :color="topUpAmount == amount ? 'primary' : 'medium'"
            @click="topUpAmount = amount"
          >
            <ion-label>{{ formatCurrency(amount) }}</ion-label>
          </ion-chip>
        </div>

        <div class="modal-buttons">
          <ion-button expand="block" fill="outline" @click="closeTopUpModal">
            Отмена
          </ion-button>
          <ion-button 
            expand="block" 
            @click="processTopUp"
            :disabled="!isTopUpValid"
          >
            Пополнить
          </ion-button>
        </div>
      </div>
    </ion-content>
  </ion-modal>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import {
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButton,
  IonIcon,
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonItem,
  IonLabel,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonChip
} from '@ionic/vue';
import { wallet, close } from 'ionicons/icons';
import userStore from '@/store/user';

const { userProfile, addToBalance, formatCurrency } = userStore;

// Состояние модального окна
const isTopUpModalOpen = ref(false);
const topUpAmount = ref<number>(0);
const paymentMethod = ref('');

// Быстрые суммы для пополнения
const quickAmounts = [500, 1000, 2000, 5000, 10000];

// Валидация формы пополнения
const isTopUpValid = computed(() => {
  return topUpAmount.value > 0 && paymentMethod.value !== '';
});

// Методы
const openTopUpModal = () => {
  isTopUpModalOpen.value = true;
  topUpAmount.value = 0;
  paymentMethod.value = '';
  
  // Добавляем запись в историю браузера для поддержки жеста "назад"
  if (window.history && window.history.pushState) {
    window.history.pushState({ modal: 'topUp' }, '', window.location.href);
  }
};

const closeTopUpModal = () => {
  const wasModalOpen = isTopUpModalOpen.value;
  
  isTopUpModalOpen.value = false;
  
  // Удаляем запись из истории браузера
  if (wasModalOpen && window.history && window.history.state) {
    const currentState = window.history.state;
    if (currentState && currentState.modal === 'topUp') {
      window.history.back();
    }
  }
};

const processTopUp = () => {
  if (isTopUpValid.value) {
    // В реальном приложении здесь была бы интеграция с платежной системой
    addToBalance(Number(topUpAmount.value));
    
    // Показываем уведомление об успехе
    alert(`Счет пополнен на ${formatCurrency(topUpAmount.value)}`);
    
    closeTopUpModal();
  }
};

// Обработчик системного жеста "назад" для модального окна
onMounted(() => {
  const handlePopState = () => {
    if (isTopUpModalOpen.value) {
      // Закрываем модальное окно без вызова history.back()
      isTopUpModalOpen.value = false;
    }
  };
  
  window.addEventListener('popstate', handlePopState);
});
</script>

<style scoped>
.balance-display {
  text-align: center;
}

.balance-amount {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.amount {
  font-size: 24px;
  font-weight: bold;
  color: var(--ion-color-primary);
}

.card-header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.top-up-button {
  --padding-start: 12px;
  --padding-end: 12px;
  height: 32px;
  font-size: 12px;
}

.balance-actions {
  display: flex;
  justify-content: center;
}

.quick-amounts {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 16px 0;
  justify-content: center;
}

.modal-buttons {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

.modal-buttons ion-button {
  flex: 1;
}
</style>
