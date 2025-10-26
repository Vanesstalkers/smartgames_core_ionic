<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import {
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonButton,
  IonCheckbox,
  IonIcon
} from '@ionic/vue';
import { star, starOutline } from 'ionicons/icons';
import type { Contact } from '@/store/contacts';

interface Props {
  contact?: Contact | null;
  isOpen: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  contact: null,
  isOpen: false
});

const emit = defineEmits<{
  save: [contactData: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>];
  cancel: [];
}>();

// Форма контакта
const form = ref({
  name: '',
  phone: '',
  email: '',
  notes: '',
  category: 'Другое',
  birthday: '',
  isFavorite: false
});

// Категории контактов
const categories = [
  { value: 'Семья', label: 'Семья' },
  { value: 'Друзья', label: 'Друзья' },
  { value: 'Коллеги', label: 'Коллеги' },
  { value: 'Другое', label: 'Другое' }
];

// Функция для форматирования номера телефона
function formatPhoneNumber(value: string): string {
  // Удаляем все нецифровые символы
  const numbers = value.replace(/\D/g, '');
  
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

// Обработчик ввода номера телефона
function onPhoneInput(event: any) {
  const value = event.target.value;
  const formatted = formatPhoneNumber(value);
  form.value.phone = formatted;
}

// Валидация формы
const isFormValid = computed(() => {
  return form.value.name.trim().length > 0;
});

// Сброс формы
function resetForm() {
  form.value = {
    name: '',
    phone: '',
    email: '',
    notes: '',
    category: 'Другое',
    birthday: '',
    isFavorite: false
  };
}

// Заполнение формы данными контакта
function populateForm(contact: Contact) {
  form.value = {
    name: contact.name,
    phone: contact.phone ? formatPhoneNumber(contact.phone) : '',
    email: contact.email || '',
    notes: contact.notes || '',
    category: contact.category || 'Другое',
    birthday: contact.birthday || '',
    isFavorite: contact.isFavorite
  };
}

// Сохранение контакта
function saveContact() {
  if (!isFormValid.value) return;

  // Очищаем номер телефона от форматирования для сохранения
  const cleanPhone = form.value.phone.replace(/\D/g, '');

  const contactData = {
    name: form.value.name.trim(),
    phone: cleanPhone || undefined,
    email: form.value.email.trim() || undefined,
    notes: form.value.notes.trim() || undefined,
    category: form.value.category,
    birthday: form.value.birthday || undefined,
    isFavorite: form.value.isFavorite
  };

  emit('save', contactData);
  resetForm();
}

// Отмена редактирования
function cancelEdit() {
  resetForm();
  emit('cancel');
}

// Следим за изменениями контакта
watch(() => props.contact, (newContact) => {
  if (newContact) {
    populateForm(newContact);
  } else {
    resetForm();
  }
}, { immediate: true });

// Следим за открытием модального окна
watch(() => props.isOpen, (isOpen) => {
  if (isOpen && props.contact) {
    populateForm(props.contact);
  } else if (isOpen && !props.contact) {
    resetForm();
  }
});
</script>

<template>
  <div class="contact-form">
    <ion-item>
      <ion-label position="stacked">
        Имя <span class="required">*</span>
      </ion-label>
      <ion-input
        v-model="form.name"
        placeholder="Введите имя"
        :class="{ 'ion-invalid': !isFormValid && form.name.length > 0 }"
        required
      ></ion-input>
    </ion-item>

    <ion-item>
      <ion-label position="stacked">Телефон</ion-label>
      <ion-input
        v-model="form.phone"
        placeholder="+7 (999) 123-45-67"
        type="tel"
        @ion-input="onPhoneInput"
      ></ion-input>
    </ion-item>

    <ion-item>
      <ion-label position="stacked">Email</ion-label>
      <ion-input
        v-model="form.email"
        placeholder="example@email.com"
        type="email"
      ></ion-input>
    </ion-item>

    <ion-item>
      <ion-label position="stacked">Дата рождения</ion-label>
      <ion-input
        v-model="form.birthday"
        placeholder="YYYY-MM-DD"
        type="date"
      ></ion-input>
    </ion-item>

    <ion-item>
      <ion-label position="stacked">Категория</ion-label>
      <ion-select 
        v-model="form.category" 
        interface="popover"
        placeholder="Выберите категорию"
      >
        <ion-select-option
          v-for="category in categories"
          :key="category.value"
          :value="category.value"
        >
          {{ category.label }}
        </ion-select-option>
      </ion-select>
    </ion-item>

    <ion-item>
      <ion-label position="stacked">Заметки</ion-label>
      <ion-textarea
        v-model="form.notes"
        placeholder="Дополнительная информация о контакте"
        :rows="3"
        auto-grow
      ></ion-textarea>
    </ion-item>

    <ion-item>
      <ion-label>Избранный контакт</ion-label>
      <ion-checkbox
        v-model="form.isFavorite"
        slot="end"
      ></ion-checkbox>
    </ion-item>

    <div class="form-actions">
      <ion-button
        expand="block"
        :disabled="!isFormValid"
        @click="saveContact"
      >
        <ion-icon 
          :icon="form.isFavorite ? star : starOutline" 
          slot="start"
          v-if="form.isFavorite"
        ></ion-icon>
        {{ contact ? 'Сохранить изменения' : 'Добавить контакт' }}
      </ion-button>
      
      <ion-button
        expand="block"
        fill="outline"
        @click="cancelEdit"
      >
        Отмена
      </ion-button>
    </div>
  </div>
</template>

<style scoped>
.contact-form {
  padding: 16px 0;
}

.required {
  color: var(--ion-color-danger);
  font-weight: bold;
}

.form-actions {
  margin-top: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ion-invalid {
  --border-color: var(--ion-color-danger);
}

ion-item {
  --padding-start: 0;
  --padding-end: 0;
  margin-bottom: 16px;
}

ion-label {
  font-weight: 500;
  margin-bottom: 8px;
}

ion-input,
ion-textarea {
  --padding-start: 12px;
  --padding-end: 12px;
  --padding-top: 12px;
  --padding-bottom: 12px;
  border: 1px solid var(--ion-color-step-200);
  border-radius: 8px;
  margin-top: 8px;
}

ion-input:focus-within,
ion-textarea:focus-within {
  --border-color: var(--ion-color-primary);
  border-color: var(--ion-color-primary);
}

ion-select {
  --padding-start: 12px;
  --padding-end: 12px;
  --padding-top: 12px;
  --padding-bottom: 12px;
  border: 1px solid var(--ion-color-step-200);
  border-radius: 8px;
  margin-top: 8px;
}

ion-checkbox {
  --size: 20px;
  --checkbox-background-checked: var(--ion-color-primary);
  --border-color-checked: var(--ion-color-primary);
}
</style>
