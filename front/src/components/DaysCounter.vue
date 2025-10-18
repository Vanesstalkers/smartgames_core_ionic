<template>
  <div class="days-counter" :class="counterClass">
    <span class="days-number">{{ daysRemaining }}</span>
    <span class="days-label">{{ daysLabel }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue';

interface Props {
  targetDate: string;
}

const props = defineProps<Props>();

const currentDate = ref(new Date());

// Обновляем текущую дату каждую минуту
let intervalId: number | null = null;

onMounted(() => {
  intervalId = window.setInterval(() => {
    currentDate.value = new Date();
  }, 60000); // обновляем каждую минуту
});

onUnmounted(() => {
  if (intervalId) {
    clearInterval(intervalId);
  }
});

const daysRemaining = computed(() => {
  const today = new Date();
  const target = new Date(props.targetDate);
  
  // Сбрасываем время для корректного сравнения дат
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  
  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
});

const daysLabel = computed(() => {
  const days = daysRemaining.value;
  
  if (days < 0) {
    return 'дней назад';
  } else if (days === 0) {
    return 'сегодня';
  } else if (days === 1) {
    return 'день';
  } else if (days < 5) {
    return 'дня';
  } else {
    return 'дней';
  }
});

const counterClass = computed(() => {
  const days = daysRemaining.value;
  
  if (days < 0) {
    return 'past';
  } else if (days === 0) {
    return 'today';
  } else if (days <= 7) {
    return 'soon';
  } else if (days <= 30) {
    return 'upcoming';
  } else {
    return 'future';
  }
});
</script>

<style scoped>
.days-counter {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 12px;
  border-radius: 8px;
  background: var(--ion-color-light);
  min-width: 60px;
  transition: all 0.3s ease;
}

.days-number {
  font-size: 20px;
  font-weight: bold;
  line-height: 1;
}

.days-label {
  font-size: 11px;
  text-transform: uppercase;
  font-weight: 500;
  margin-top: 2px;
}

/* Стили для разных состояний */
.days-counter.today {
  background: var(--ion-color-danger);
  color: white;
}

.days-counter.today .days-number {
  font-size: 18px;
}

.days-counter.soon {
  background: var(--ion-color-warning);
  color: white;
}

.days-counter.upcoming {
  background: var(--ion-color-primary);
  color: white;
}

.days-counter.future {
  background: var(--ion-color-medium);
  color: white;
}

.days-counter.past {
  background: var(--ion-color-step-100);
  color: var(--ion-color-medium);
}

/* Анимация для сегодняшнего дня */
.days-counter.today {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
}
</style>
