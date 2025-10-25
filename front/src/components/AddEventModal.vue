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
        <ion-item button @click="openDateModal">
          <ion-label position="stacked">Дата события *</ion-label>
          <ion-input 
            :value="formattedDate"
            readonly
            placeholder="Выберите дату"
            slot="end"
          ></ion-input>
          <ion-icon :icon="calendarOutline" slot="end"></ion-icon>
        </ion-item>
        
        <!-- Отладочная информация -->
        <ion-item v-if="true">
          <ion-label>
            <h3>🐛 Отладка:</h3>
            <p>form.date: {{ form.date }}</p>
            <p>selectedDateTime: {{ selectedDateTime }}</p>
            <p>formattedDate: {{ formattedDate }}</p>
            <p>datetimeKey: {{ datetimeKey }}</p>
            <p>isDateModalOpen: {{ isDateModalOpen }}</p>
            <p>minDate: {{ minDate }}</p>
            <p>maxDate: {{ maxDate }}</p>
          </ion-label>
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
        
        <!-- Бюджет события -->
        <ion-item>
          <ion-label position="stacked">Бюджет события</ion-label>
          <ion-input 
            v-model="form.budget" 
            type="number" 
            placeholder="Укажите бюджет (необязательно)"
            :min="0"
          ></ion-input>
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
    
    <!-- Модальное окно выбора даты -->
    <ion-modal :is-open="isDateModalOpen" @did-dismiss="closeDateModal">
      <ion-header>
        <ion-toolbar>
          <ion-title>Выберите дату</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="closeDateModal">
              <ion-icon :icon="close"></ion-icon>
            </ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content>
        <ion-datetime 
          :key="`datetime-${datetimeKey}`"
          presentation="date"
          :max="maxDate"
          :min="minDate"
          :value="selectedDateTime"
          @ion-change="onDateChange"
          @ion-ready="onDatetimeReady"
          :show-default-buttons="false"
          :show-clear-button="false"
        ></ion-datetime>
        <div class="datetime-actions">
          <ion-button expand="block" @click="confirmDate">Выбрать дату</ion-button>
        </div>
      </ion-content>
    </ion-modal>
  </ion-modal>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
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
import { close, calendarOutline } from 'ionicons/icons';

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
  isOpen: boolean;
  editingEvent?: MemorialEvent | null;
}

const props = defineProps<Props>();

// Эмиты
const emit = defineEmits<{
  close: [];
  save: [event: Omit<MemorialEvent, 'id'>];
}>();

// Состояние модального окна даты
const isDateModalOpen = ref(false);
const datetimeKey = ref(0);
const selectedDateTime = ref(new Date().toISOString());

// Форма
const form = ref({
  title: '',
  date: new Date().toISOString().split('T')[0], // Устанавливаем сегодняшнюю дату по умолчанию
  description: '',
  category: '',
  isImportant: false,
  reminderDays: [] as number[],
  color: '#3880ff',
  budget: 0
});

console.log('🚀 Инициализация формы');
console.log('📅 Начальная дата:', form.value.date);
console.log('⏰ selectedDateTime при инициализации:', selectedDateTime.value);

// Инициализация при монтировании
onMounted(() => {
  console.log('🎯 Компонент смонтирован');
  selectedDateTime.value = form.value.date + 'T12:00:00.000Z';
  console.log('⏰ Установлен selectedDateTime при монтировании:', selectedDateTime.value);
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

// Минимальная дата (вчера, чтобы можно было выбирать прошедшие даты)
const minDate = computed(() => {
  const date = new Date();
  date.setDate(date.getDate() - 1); // Вчера
  return date.toISOString();
});

// Максимальная дата (через 10 лет)
const maxDate = computed(() => {
  const date = new Date();
  date.setFullYear(date.getFullYear() + 10);
  return date.toISOString();
});

// Форматированная дата для отображения
const formattedDate = computed(() => {
  console.log('🎨 Computed: форматирование даты для отображения');
  console.log('📅 form.value.date:', form.value.date);
  
  if (!form.value.date) {
    console.log('❌ Пустая дата в форме');
    return '';
  }
  
  const date = new Date(form.value.date);
  const formatted = date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  
  console.log('✅ Отформатированная дата:', formatted);
  return formatted;
});

// Инициализация selectedDateTime при изменении form.date
watch(() => form.value.date, (newDate, oldDate) => {
  console.log('👀 Watch: изменение form.date');
  console.log('📅 Старая дата:', oldDate);
  console.log('📅 Новая дата:', newDate);
  
  if (newDate) {
    const newDateTime = newDate + 'T12:00:00.000Z';
    selectedDateTime.value = newDateTime;
    console.log('⏰ Watch: обновлен selectedDateTime:', newDateTime);
  }
}, { immediate: true });

// Валидация формы
const isFormValid = computed(() => {
  return form.value.title.trim() !== '' && 
         form.value.date !== '' && 
         form.value.category !== '';
});

// Методы
const openDateModal = () => {
  console.log('🗓️ Открытие модального окна даты');
  console.log('📅 Текущая дата в форме:', form.value.date);
  
  // Убеждаемся, что у нас есть дата для отображения
  if (!form.value.date) {
    form.value.date = new Date().toISOString().split('T')[0];
    console.log('📅 Установлена дата по умолчанию:', form.value.date);
  }
  
  // Обновляем ключ для принудительного перерендера
  datetimeKey.value++;
  console.log('🔑 Обновлен ключ datetime:', datetimeKey.value);
  
  // Устанавливаем selectedDateTime ПЕРЕД открытием модального окна
  // Попробуем разные форматы
  const dateObj = new Date(form.value.date);
  const newDateTime = dateObj.toISOString();
  selectedDateTime.value = newDateTime;
  console.log('⏰ Установлен selectedDateTime:', newDateTime);
  console.log('📅 Исходная дата:', form.value.date);
  console.log('📅 Объект Date:', dateObj);
  
  isDateModalOpen.value = true;
  console.log('✅ Модальное окно открыто');
  
  // Принудительная инициализация календаря
  setTimeout(() => {
    console.log('🔄 Принудительная инициализация календаря');
    console.log('📊 Текущий selectedDateTime:', selectedDateTime.value);
    
    // Принудительно обновляем ключ для перерендера
    datetimeKey.value++;
    console.log('🔑 Обновлен ключ datetime (принудительно):', datetimeKey.value);
    
    // Попробуем обновить значение еще раз
    const currentDate = new Date();
    const isoString = currentDate.toISOString();
    selectedDateTime.value = isoString;
    console.log('⏰ Установлен новый selectedDateTime:', isoString);
  }, 100);
};

const closeDateModal = () => {
  isDateModalOpen.value = false;
};

const onDateChange = (event: any) => {
  console.log('🔄 Изменение даты в календаре');
  console.log('📥 Полученное значение:', event.detail.value);
  console.log('📥 Тип значения:', typeof event.detail.value);
  
  if (event.detail.value) {
    // Обновляем selectedDateTime
    selectedDateTime.value = event.detail.value;
    console.log('✅ Обновлен selectedDateTime:', selectedDateTime.value);
    
    // Преобразуем в YYYY-MM-DD для формы
    const date = new Date(event.detail.value);
    const formattedDate = date.toISOString().split('T')[0];
    form.value.date = formattedDate;
    console.log('📅 Обновлена дата в форме:', formattedDate);
  } else {
    console.log('❌ Пустое значение даты');
  }
};

const confirmDate = () => {
  closeDateModal();
};

const onDatetimeReady = (event: any) => {
  console.log('🎯 ion-datetime готов!');
  console.log('📊 Текущее значение selectedDateTime:', selectedDateTime.value);
  console.log('📊 Событие ion-ready:', event);
};

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
    date: new Date().toISOString().split('T')[0], // Устанавливаем сегодняшнюю дату по умолчанию
    description: '',
    category: '',
    isImportant: false,
    reminderDays: [],
    color: '#3880ff',
    budget: 0
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
      color: form.value.color,
      budget: form.value.budget || undefined,
      spent: 0
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
      color: newEvent.color,
      budget: newEvent.budget || 0
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

.datetime-actions {
  padding: 16px;
}

ion-item {
  margin-bottom: 16px;
}

ion-datetime {
  width: 100%;
}
</style>
