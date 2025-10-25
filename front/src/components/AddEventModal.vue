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
        <ion-item button @click="openPickerWithController">
          <ion-label position="stacked">Дата события *</ion-label>
          <ion-input 
            :value="formattedDate"
            readonly
            placeholder="Выберите дату"
            slot="end"
          ></ion-input>
          <ion-icon :icon="calendarOutline" slot="end"></ion-icon>
        </ion-item>
        
         <!-- Убираем отладочную информацию -->
        
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

        <!-- Контакты для поздравления (только для праздников) -->
        <div v-if="form.category === 'Праздник'" class="contacts-section">
          <ion-item>
            <ion-label>
              <h3>Список для поздравления</h3>
              <p>Добавьте людей, которых нужно поздравить</p>
            </ion-label>
          </ion-item>
          
          <ContactPicker v-model="form.contacts" />
        </div>
        
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
    
    <!-- Убираем модальное окно выбора даты -->
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
  IonChip
} from '@ionic/vue';
import { close, calendarOutline } from 'ionicons/icons';
import { pickerController } from '@ionic/vue';
import ContactPicker from './ContactPicker.vue';

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
  budget: 0,
  contacts: [] as Contact[]
});

// Инициализация при монтировании
onMounted(() => {
  selectedDateTime.value = form.value.date + 'T12:00:00.000Z';
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

// Колонки для picker даты
const pickerColumns = computed(() => {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 11 }, (_, i) => ({
    text: (currentYear - 1 + i).toString(),
    value: currentYear - 1 + i
  }));

  const months = [
    { text: 'Январь', value: 1 },
    { text: 'Февраль', value: 2 },
    { text: 'Март', value: 3 },
    { text: 'Апрель', value: 4 },
    { text: 'Май', value: 5 },
    { text: 'Июнь', value: 6 },
    { text: 'Июль', value: 7 },
    { text: 'Август', value: 8 },
    { text: 'Сентябрь', value: 9 },
    { text: 'Октябрь', value: 10 },
    { text: 'Ноябрь', value: 11 },
    { text: 'Декабрь', value: 12 }
  ];

  const days = Array.from({ length: 31 }, (_, i) => ({
    text: (i + 1).toString(),
    value: i + 1
  }));

  return [
    { name: 'year', options: years },
    { name: 'month', options: months },
    { name: 'day', options: days }
  ];
});

// Кнопки для picker
const pickerButtons = [
  {
    text: 'Отмена',
    role: 'cancel'
  },
  {
    text: 'Выбрать',
    role: 'confirm'
  }
];

// Удаляем неиспользуемые minDate и maxDate для picker

// Форматированная дата для отображения
const formattedDate = computed(() => {
  console.log('🎨 Форматирование даты для отображения');
  console.log('📅 form.value.date:', form.value.date);
  console.log('📅 Тип form.value.date:', typeof form.value.date);
  
  if (!form.value.date) {
    console.log('❌ Пустая дата');
    return '';
  }
  
  // Проверяем, что дата в правильном формате YYYY-MM-DD
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(form.value.date)) {
    console.error('❌ Неверный формат даты:', form.value.date);
    return '';
  }
  
  const date = new Date(form.value.date + 'T12:00:00.000Z');
  console.log('📅 Созданный объект Date:', date);
  console.log('📅 isNaN(date.getTime()):', isNaN(date.getTime()));
  
  // Проверяем, что дата валидна
  if (isNaN(date.getTime())) {
    console.error('❌ Невалидная дата:', form.value.date);
    return '';
  }
  
  const formatted = date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  
  console.log('✅ Отформатированная дата:', formatted);
  return formatted;
});

// Инициализация selectedDateTime при изменении form.date
watch(() => form.value.date, (newDate) => {
  if (newDate) {
    selectedDateTime.value = newDate + 'T12:00:00.000Z';
  }
}, { immediate: true });

// Валидация формы
const isFormValid = computed(() => {
  return form.value.title.trim() !== '' && 
         form.value.date !== '' && 
         form.value.category !== '';
});

// Убираем неиспользуемые методы

// Открытие picker через controller
const openPickerWithController = async () => {
  try {
    const picker = await pickerController.create({
      columns: pickerColumns.value,
      buttons: pickerButtons,
      backdropDismiss: true
    });
    
    await picker.present();
    
    picker.onDidDismiss().then((result) => {
      console.log('🎯 Picker результат:', result);
      console.log('📊 Role:', result.role);
      console.log('📊 Data:', result.data);
      
      if (result.role === 'confirm' && result.data) {
        const { year, month, day } = result.data;
        console.log('📅 Выбранные значения:', { year, month, day });
        
        // Извлекаем value из объектов
        const yearValue = year.value || year;
        const monthValue = month.value || month;
        const dayValue = day.value || day;
        
        console.log('📅 Извлеченные значения:', { yearValue, monthValue, dayValue });
        
        const selectedDate = `${yearValue}-${monthValue.toString().padStart(2, '0')}-${dayValue.toString().padStart(2, '0')}`;
        console.log('📅 Сформированная дата:', selectedDate);
        
        form.value.date = selectedDate;
        selectedDateTime.value = selectedDate + 'T12:00:00.000Z';
        
        console.log('✅ Дата установлена в форме:', form.value.date);
      }
    });
    
  } catch (error) {
    console.error('Ошибка при создании picker:', error);
  }
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
    budget: 0,
    contacts: [] as Contact[]
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
      budget: newEvent.budget || 0,
      contacts: newEvent.contacts || []
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

.contacts-section {
  margin-top: 16px;
  padding: 16px;
  background: var(--ion-color-light);
  border-radius: 8px;
}

.contacts-section ion-item {
  --padding-start: 0;
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
