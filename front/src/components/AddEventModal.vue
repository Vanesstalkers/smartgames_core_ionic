<template>
  <ion-modal :is-open="isOpen" @did-dismiss="handleClose">
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ editingEvent ? 'Редактировать событие' : 'Добавить событие' }}</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="handleClose">
            <ion-icon :icon="close"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    
    <ion-content class="ion-padding">
      <form @submit.prevent="saveEvent">
        <!-- Название события -->
        <ion-item>
          <ion-label position="stacked">Название события *</ion-label>
          <ion-input 
            v-model="form.title" 
            placeholder="Например: День рождения мамы"
            required
          ></ion-input>
        </ion-item>
        
        <!-- Дата события -->
        <ion-item>
          <ion-label position="stacked">Дата события *</ion-label>
          <ion-datetime 
            v-model="form.date"
            presentation="date"
            :max="maxDate"
            required
          ></ion-datetime>
        </ion-item>
        
        <!-- Описание -->
        <ion-item>
          <ion-label position="stacked">Описание</ion-label>
          <ion-textarea 
            v-model="form.description"
            placeholder="Дополнительная информация о событии"
            :rows="3"
          ></ion-textarea>
        </ion-item>
        
        <!-- Категория -->
        <ion-item>
          <ion-label position="stacked">Категория *</ion-label>
          <ion-select v-model="form.category" placeholder="Выберите категорию">
            <ion-select-option value="Семья">Семья</ion-select-option>
            <ion-select-option value="Друзья">Друзья</ion-select-option>
            <ion-select-option value="Работа">Работа</ion-select-option>
            <ion-select-option value="Память">Память</ion-select-option>
            <ion-select-option value="Праздник">Праздник</ion-select-option>
            <ion-select-option value="Другое">Другое</ion-select-option>
          </ion-select>
        </ion-item>
        
        <!-- Важное событие -->
        <ion-item>
          <ion-label>Важное событие</ion-label>
          <ion-toggle slot="end" v-model="form.isImportant"></ion-toggle>
        </ion-item>
        
        <!-- Напоминания -->
        <ion-item>
          <ion-label position="stacked">Напоминания</ion-label>
          <div class="reminder-options">
            <ion-chip 
              v-for="day in reminderOptions" 
              :key="day.value"
              :color="form.reminderDays.includes(day.value) ? 'primary' : 'medium'"
              @click="toggleReminder(day.value)"
            >
              <ion-label>{{ day.label }}</ion-label>
            </ion-chip>
          </div>
        </ion-item>
        
        <!-- Цвет события -->
        <ion-item>
          <ion-label position="stacked">Цвет события</ion-label>
          <div class="color-options">
            <div 
              v-for="color in colorOptions" 
              :key="color.value"
              class="color-option"
              :class="{ active: form.color === color.value }"
              :style="{ backgroundColor: color.value }"
              @click="form.color = color.value"
            ></div>
          </div>
        </ion-item>
        
        <!-- Кнопки -->
        <div class="modal-buttons">
          <ion-button expand="block" fill="outline" @click="handleClose">
            Отмена
          </ion-button>
          <ion-button expand="block" type="submit" :disabled="!isFormValid">
            {{ editingEvent ? 'Сохранить' : 'Добавить' }}
          </ion-button>
        </div>
      </form>
    </ion-content>
  </ion-modal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonIcon,
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonToggle,
  IonDatetime,
  IonChip
} from '@ionic/vue';
import { close } from 'ionicons/icons';

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
}

// Пропсы
interface Props {
  isOpen: boolean;
  editingEvent?: MemorialEvent | null;
}

const props = defineProps<Props>();

// Эмиты
const emit = defineEmits<{
  close: [];
  save: [event: Omit<MemorialEvent, 'id'>];
}>();

// Форма
const form = ref({
  title: '',
  date: '',
  description: '',
  category: '',
  isImportant: false,
  reminderDays: [] as number[],
  color: '#3880ff'
});

// Опции для напоминаний
const reminderOptions = [
  { value: 30, label: 'за 30 дней' },
  { value: 7, label: 'за неделю' },
  { value: 3, label: 'за 3 дня' },
  { value: 1, label: 'за день' },
  { value: 0, label: 'в день' }
];

// Цветовые опции
const colorOptions = [
  { value: '#3880ff', label: 'Синий' },
  { value: '#ff6b6b', label: 'Красный' },
  { value: '#4ecdc4', label: 'Бирюзовый' },
  { value: '#45b7d1', label: 'Голубой' },
  { value: '#96ceb4', label: 'Зеленый' },
  { value: '#feca57', label: 'Желтый' },
  { value: '#ff9ff3', label: 'Розовый' },
  { value: '#95a5a6', label: 'Серый' }
];

// Максимальная дата (через 10 лет)
const maxDate = computed(() => {
  const date = new Date();
  date.setFullYear(date.getFullYear() + 10);
  return date.toISOString();
});

// Валидация формы
const isFormValid = computed(() => {
  return form.value.title.trim() !== '' && 
         form.value.date !== '' && 
         form.value.category !== '';
});

// Методы
const toggleReminder = (day: number) => {
  const index = form.value.reminderDays.indexOf(day);
  if (index > -1) {
    form.value.reminderDays.splice(index, 1);
  } else {
    form.value.reminderDays.push(day);
  }
};

const resetForm = () => {
  form.value = {
    title: '',
    date: '',
    description: '',
    category: '',
    isImportant: false,
    reminderDays: [],
    color: '#3880ff'
  };
};

const handleClose = () => {
  emit('close');
  resetForm();
};

const saveEvent = () => {
  if (isFormValid.value) {
    const eventData: Omit<MemorialEvent, 'id'> = {
      title: form.value.title.trim(),
      date: form.value.date.split('T')[0], // Убираем время, оставляем только дату
      description: form.value.description.trim(),
      category: form.value.category,
      isImportant: form.value.isImportant,
      reminderDays: [...form.value.reminderDays].sort((a, b) => b - a),
      color: form.value.color
    };
    
    emit('save', eventData);
    resetForm();
  }
};

// Следим за редактируемым событием
watch(() => props.editingEvent, (newEvent) => {
  if (newEvent) {
    form.value = {
      title: newEvent.title,
      date: newEvent.date,
      description: newEvent.description || '',
      category: newEvent.category,
      isImportant: newEvent.isImportant,
      reminderDays: [...newEvent.reminderDays],
      color: newEvent.color
    };
  }
}, { immediate: true });
</script>

<style scoped>
.reminder-options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.color-options {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}

.color-option {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s ease;
}

.color-option.active {
  border-color: var(--ion-color-dark);
  transform: scale(1.1);
}

.modal-buttons {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

.modal-buttons ion-button {
  flex: 1;
}

ion-item {
  margin-bottom: 16px;
}

ion-datetime {
  width: 100%;
}
</style>
