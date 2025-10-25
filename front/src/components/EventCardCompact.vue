<template>
  <ion-card class="event-card" :class="{ 'important': event.isImportant }">
    <ion-card-content @click="$emit('edit', event.id)">
      <div class="event-header" @click="$emit('edit', event.id)">
        <div class="event-info">
          <h3 class="event-title">{{ event.title }}</h3>
        </div>
        <div class="days-remaining" v-if="daysUntilEvent >= 0">
          <DaysCounter :target-date="event.date" />
        </div>
      </div>
    </ion-card-content>
  </ion-card>
</template>

<script setup lang="ts">
defineOptions({
  name: 'EventCardCompact'
});

import { computed } from 'vue';
import {
  IonCard,
  IonCardContent,
} from '@ionic/vue';
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
  contacts?: Contact[];
}

interface Contact {
  name?: string;
  tel?: string;
  email?: string;
}

// Пропсы
interface Props {
  event: MemorialEvent;
}

const props = defineProps<Props>();

// Эмиты
const daysUntilEvent = computed(() => {
  const today = new Date();
  const eventDate = new Date(props.event.date);
  const diffTime = eventDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Методы
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
  font-size: 12px;
  color: var(--ion-color-medium);
  font-weight: 500;
}

.event-date ion-icon {
  font-size: 14px;
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

  ion-icon {
    margin-left: -4px;
  }
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

.contacts-info {
  margin-top: 8px;
  padding: 8px 12px;
  background: var(--ion-color-light);
  border-radius: 16px;
}

.contacts-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 0.9em;
  font-weight: 500;
}

.contacts-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
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
