<template>
  <ion-card class="event-card" :class="{ 'important': event.isImportant }">
    <ion-card-content>
      <div class="event-header">
        <div class="event-info">
          <h3 class="event-title">{{ event.title }}</h3>
          <p class="event-date">
            <ion-icon :icon="calendarOutline"></ion-icon>
            {{ formattedDate }}
          </p>
          <p v-if="event.description" class="event-description">
            {{ event.description }}
          </p>
        </div>
        <div class="event-actions">
          <ion-button fill="clear" size="small" @click="$emit('edit', event.id)">
            <ion-icon :icon="createOutline"></ion-icon>
          </ion-button>
          <ion-button fill="clear" size="small" color="danger" @click="confirmDelete">
            <ion-icon :icon="trashOutline"></ion-icon>
          </ion-button>
        </div>
      </div>
      
      <div class="event-footer">
        <div class="event-meta">
          <ion-chip :color="getCategoryColor(event.category)">
            <ion-icon :icon="getCategoryIcon(event.category)"></ion-icon>
            <ion-label>{{ event.category }}</ion-label>
          </ion-chip>
          <ion-chip v-if="event.isImportant" color="danger">
            <ion-icon :icon="heart"></ion-icon>
            <ion-label>Важное</ion-label>
          </ion-chip>
        </div>
        
        <div class="days-remaining" v-if="daysUntilEvent >= 0">
          <DaysCounter :target-date="event.date" />
        </div>
      </div>
      
      <!-- Информация о бюджете -->
      <div v-if="event.budget && event.budget > 0" class="budget-info">
        <ion-icon :icon="wallet" color="primary"></ion-icon>
        <span>Бюджет: {{ formatCurrency(event.budget) }}</span>
        <span v-if="event.spent && event.spent > 0" class="spent">
          (потрачено: {{ formatCurrency(event.spent) }})
        </span>
      </div>
      
      <!-- Индикатор повторений -->
      <div v-if="event.reminderDays.length > 0" class="reminder-info">
        <ion-icon :icon="notificationsOutline"></ion-icon>
        <span>Напоминания: {{ formatReminderDays(event.reminderDays) }}</span>
      </div>
    </ion-card-content>
  </ion-card>
</template>

<script setup lang="ts">
defineOptions({
  name: 'EventCard'
});

import { computed } from 'vue';
import {
  IonCard,
  IonCardContent,
  IonButton,
  IonIcon,
  IonChip,
  IonLabel
} from '@ionic/vue';
import {
  calendarOutline,
  createOutline,
  trashOutline,
  heart,
  notificationsOutline,
  peopleOutline,
  heartOutline,
  businessOutline,
  starOutline,
  wallet
} from 'ionicons/icons';
import { defineAsyncComponent } from 'vue';

const DaysCounter = defineAsyncComponent(() => import('./DaysCounter.vue'));

// Интерфейс события
interface MemorialEvent {
  id: string;
  title: string;
  date: string;
  description?: string;
  category: string;
  isImportant: boolean;
  reminderDays: number[];
  color: string;
  budget?: number;
  spent?: number;
}

// Пропсы
interface Props {
  event: MemorialEvent;
}

const props = defineProps<Props>();

// Эмиты
const emit = defineEmits<{
  edit: [id: string];
  delete: [id: string];
}>();

// Вычисляемые свойства
const formattedDate = computed(() => {
  const date = new Date(props.event.date);
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
});

const daysUntilEvent = computed(() => {
  const today = new Date();
  const eventDate = new Date(props.event.date);
  const diffTime = eventDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Методы
const getCategoryColor = (category: string): string => {
  const colors: Record<string, string> = {
    'Семья': 'primary',
    'Друзья': 'secondary',
    'Работа': 'tertiary',
    'Память': 'medium',
    'Праздник': 'success',
    'Другое': 'warning'
  };
  return colors[category] || 'medium';
};

const getCategoryIcon = (category: string) => {
  const icons: Record<string, any> = {
    'Семья': heartOutline,
    'Друзья': peopleOutline,
    'Работа': businessOutline,
    'Память': starOutline,
    'Праздник': starOutline,
    'Другое': starOutline
  };
  return icons[category] || starOutline;
};

const formatReminderDays = (days: number[]): string => {
  return days
    .sort((a, b) => a - b)
    .map(day => {
      if (day === 0) return 'в день события';
      if (day === 1) return 'за 1 день';
      return `за ${day} дней`;
    })
    .join(', ');
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB'
  }).format(amount);
};

const confirmDelete = () => {
  if (confirm('Вы уверены, что хотите удалить это событие?')) {
    emit('delete', props.event.id);
  }
};

defineExpose({});
</script>

<style scoped>
.event-card {
  margin-bottom: 12px;
  border-left: 4px solid var(--ion-color-primary);
  transition: transform 0.2s ease;
}

.event-card.important {
  border-left-color: var(--ion-color-danger);
  background: linear-gradient(135deg, rgba(255, 107, 107, 0.05) 0%, transparent 100%);
}

.event-card:hover {
  transform: translateY(-2px);
}

.event-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.event-info {
  flex: 1;
}

.event-title {
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--ion-color-dark);
}

.event-date {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0 0 8px 0;
  font-size: 14px;
  color: var(--ion-color-medium);
}

.event-date ion-icon {
  font-size: 16px;
}

.event-description {
  margin: 0;
  font-size: 14px;
  color: var(--ion-color-step-600);
  line-height: 1.4;
}

.event-actions {
  display: flex;
  gap: 4px;
}

.event-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.event-meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.days-remaining {
  text-align: right;
}

.budget-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  font-size: 14px;
  color: var(--ion-color-medium);
  padding: 8px 12px;
  background: var(--ion-color-light);
  border-radius: 8px;
}

.budget-info .spent {
  color: var(--ion-color-warning);
  font-size: 12px;
}

.reminder-info {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--ion-color-medium);
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid var(--ion-color-light);
}

.reminder-info ion-icon {
  font-size: 14px;
}

@media (max-width: 768px) {
  .event-footer {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .days-remaining {
    text-align: left;
  }
}
</style>
