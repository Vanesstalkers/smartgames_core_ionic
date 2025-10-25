import { ref, watch } from 'vue';

export interface UserProfile {
  id: string;
  name: string;
  balance: number; // Текущий баланс пользователя
  currency: string; // Валюта (RUB, USD, EUR)
}

const LS_USER_KEY = 'sg_user_v1';

const userProfile = ref<UserProfile>({
  id: 'default_user',
  name: 'Пользователь',
  balance: 0,
  currency: 'RUB'
});

function loadUser() {
  try {
    const raw = localStorage.getItem(LS_USER_KEY);
    if (raw) {
      userProfile.value = JSON.parse(raw) as UserProfile;
    }
  } catch (e) {
    console.error('Failed to load user from localStorage', e);
  }
}

function saveUser() {
  try {
    localStorage.setItem(LS_USER_KEY, JSON.stringify(userProfile.value));
  } catch (e) {
    console.error('Failed to save user to localStorage', e);
  }
}

// Методы для работы с балансом
function addToBalance(amount: number) {
  userProfile.value.balance += amount;
  saveUser();
}

function subtractFromBalance(amount: number): boolean {
  if (userProfile.value.balance >= amount) {
    userProfile.value.balance -= amount;
    saveUser();
    return true;
  }
  return false;
}

// Форматирование валюты
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: userProfile.value.currency
  }).format(amount);
}

// Следим за изменениями и сохраняем
watch(userProfile, () => saveUser(), { deep: true });

// Инициализация при загрузке модуля
loadUser();

export default {
  userProfile,
  addToBalance,
  subtractFromBalance,
  formatCurrency
};
