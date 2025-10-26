<script setup lang="ts">
import {
  IonCard,
  IonCardContent,
  IonIcon,
  IonButton,
  IonBadge
} from '@ionic/vue';
import {
  star,
  call,
  mail,
  menu,
  people,
  person,
  business,
  calendar
} from 'ionicons/icons';
import type { Contact } from '@/store/contacts';

interface Props {
  contact: Contact;
  showActions?: boolean;
  compact?: boolean;
}

withDefaults(defineProps<Props>(), {
  showActions: true,
  compact: false
});

const emit = defineEmits<{
  menu: [contact: Contact];
  call: [contact: Contact];
  email: [contact: Contact];
  edit: [contact: Contact];
  delete: [contact: Contact];
}>();

// Функция для форматирования номера телефона для отображения
function formatPhoneDisplay(phone: string): string {
  if (!phone) return '';
  
  // Удаляем все нецифровые символы
  const numbers = phone.replace(/\D/g, '');
  
  // Если номер начинается с 8, заменяем на +7
  let formatted = numbers;
  if (formatted.startsWith('8') && formatted.length > 1) {
    formatted = '7' + formatted.slice(1);
  }
  
  // Если номер начинается с 7, добавляем +
  if (formatted.startsWith('7') && formatted.length > 1) {
    formatted = '+' + formatted;
  }
  
  // Форматируем в зависимости от длины
  if (formatted.length <= 1) {
    return formatted;
  } else if (formatted.length <= 2) {
    return formatted;
  } else if (formatted.length <= 5) {
    return formatted.slice(0, 2) + ' (' + formatted.slice(2);
  } else if (formatted.length <= 8) {
    return formatted.slice(0, 2) + ' (' + formatted.slice(2, 5) + ') ' + formatted.slice(5);
  } else if (formatted.length <= 10) {
    return formatted.slice(0, 2) + ' (' + formatted.slice(2, 5) + ') ' + formatted.slice(5, 8) + '-' + formatted.slice(8);
  } else {
    return formatted.slice(0, 2) + ' (' + formatted.slice(2, 5) + ') ' + formatted.slice(5, 8) + '-' + formatted.slice(8, 10) + '-' + formatted.slice(10, 12);
  }
}

// Функция для форматирования даты рождения
function formatBirthday(birthday: string): string {
  if (!birthday) return '';
  
  try {
    const date = new Date(birthday);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}.${month}.${year}`;
  } catch (error) {
    return birthday; // Возвращаем исходную строку в случае ошибки
  }
}

// Функция для расчета дней до дня рождения
function getDaysUntilBirthday(birthday: string): number | null {
  if (!birthday) return null;
  
  try {
    const today = new Date();
    const birthDate = new Date(birthday);
    
    // Устанавливаем текущий год для дня рождения
    const currentYear = today.getFullYear();
    const thisYearBirthday = new Date(currentYear, birthDate.getMonth(), birthDate.getDate());
    
    // Если день рождения уже прошел в этом году, берем следующий год
    if (thisYearBirthday < today) {
      thisYearBirthday.setFullYear(currentYear + 1);
    }
    
    // Вычисляем разность в днях
    const timeDiff = thisYearBirthday.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    return daysDiff;
  } catch (error) {
    return null;
  }
}

// Функция для получения текста о днях до дня рождения
function getDaysUntilBirthdayText(birthday: string): string {
  const days = getDaysUntilBirthday(birthday);
  if (days === null) return '';
  
  if (days === 0) {
    return 'Сегодня!';
  } else if (days === 1) {
    return 'Завтра';
  } else if (days <= 7) {
    return `через ${days} дн.`;
  } else {
    return `через ${days} дн.`;
  }
}

function getCategoryIcon(category: string) {
  switch (category) {
    case 'Семья': return people;
    case 'Друзья': return person;
    case 'Коллеги': return business;
    default: return person;
  }
}

function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    'Семья': 'primary',
    'Друзья': 'secondary',
    'Коллеги': 'tertiary',
    'Другое': 'medium'
  };
  return colors[category] || 'medium';
}

</script>

<template>
  <ion-card class="contact-card" :class="{ compact }">
    <ion-card-content>
      <div class="contact-header">
        <div class="contact-info">
          <h2 class="contact-name">
            <ion-icon
              v-if="contact.isFavorite"
              :icon="star"
              color="warning"
              class="favorite-icon"
            ></ion-icon>
            <ion-icon
              v-if="contact.category"
              :icon="getCategoryIcon(contact.category)"
              :color="getCategoryColor(contact.category)"
              class="category-icon"
            ></ion-icon>
            {{ contact.name }}
          </h2>
          
          <p v-if="contact.phone" class="contact-phone">
            <ion-icon :icon="call" class="contact-icon"></ion-icon>
            {{ formatPhoneDisplay(contact.phone) }}
          </p>
          
          <p v-if="contact.email" class="contact-email">
            <ion-icon :icon="mail" class="contact-icon"></ion-icon>
            {{ contact.email }}
          </p>
          
          <p v-if="contact.birthday" class="contact-birthday">
            <ion-icon :icon="calendar" class="contact-icon"></ion-icon>
            {{ formatBirthday(contact.birthday) }}
            <ion-badge 
              v-if="getDaysUntilBirthday(contact.birthday) !== null"
              :color="getDaysUntilBirthday(contact.birthday)! <= 7 ? 'warning' : 'light'"
              class="birthday-badge"
            >
              {{ getDaysUntilBirthdayText(contact.birthday) }}
            </ion-badge>
          </p>
          
          <p v-if="contact.notes && !compact" class="contact-notes">
            {{ contact.notes }}
          </p>
        </div>
        
        <ion-button
          v-if="showActions"
          fill="clear"
          size="small"
          class="action-button"
          @click="emit('menu', contact)"
        >
          <ion-icon 
            :icon="menu" 
            color="medium"
          ></ion-icon>
        </ion-button>
      </div>

    </ion-card-content>
  </ion-card>
</template>

<style scoped>
.contact-card {
  margin-bottom: 12px;
}

.contact-card.compact {
  margin-bottom: 8px;
}

.contact-card.compact .contact-actions {
  display: none;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  background: var(--ion-color-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 0.9rem;
}

.contact-name {
  display: flex;
  align-items: center;
  margin: 0 0 4px 0;
  font-size: 1.1rem;
  font-weight: 600;
}

.favorite-icon {
  margin-right: 8px;
  font-size: 1rem;
}

.category-icon {
  margin-right: 8px;
  font-size: 1rem;
}

.contact-phone,
.contact-email,
.contact-birthday {
  display: flex;
  align-items: center;
  margin: 2px 0;
  font-size: 0.9rem;
  color: var(--ion-color-step-600);
}

.contact-birthday {
  gap: 8px;
}

.birthday-badge {
  font-size: 0.75rem;
  height: 20px;
  --padding-start: 6px;
  --padding-end: 6px;
}

.contact-icon {
  margin-right: 6px;
  font-size: 0.8rem;
  color: var(--ion-color-primary);
}

.contact-notes {
  margin: 8px 0 0 0;
  font-size: 0.85rem;
  color: var(--ion-color-medium);
  font-style: italic;
}

.contact-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
  position: relative;
}

.contact-info {
  flex: 1;
  margin-right: 12px;
}

.action-button {
  position: absolute;
  top: 0;
  right: 0;
  --padding-start: 8px;
  --padding-end: 8px;
  --padding-top: 8px;
  --padding-bottom: 8px;
  min-width: 32px;
  height: 32px;
}


</style>
