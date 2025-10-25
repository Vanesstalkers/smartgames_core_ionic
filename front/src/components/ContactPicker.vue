<template>
  <div class="contact-picker">
    <!-- Кнопка импорта контактов -->
    <ion-button 
      expand="block" 
      fill="outline" 
      @click="importContacts"
      :disabled="!isContactPickerSupported"
    >
      <ion-icon :icon="peopleOutline" slot="start"></ion-icon>
      {{ isContactPickerSupported ? 'Импортировать контакты' : 'Контакты недоступны' }}
    </ion-button>

    <!-- Список выбранных контактов -->
    <div v-if="selectedContacts.length > 0" class="selected-contacts">
      <h4>Выбранные контакты ({{ selectedContacts.length }})</h4>
      
      <ion-list>
        <ion-item 
          v-for="(contact, index) in selectedContacts" 
          :key="index"
          class="contact-item"
        >
          <ion-avatar slot="start">
            <ion-icon :icon="personOutline"></ion-icon>
          </ion-avatar>
          
          <ion-label>
            <h3>{{ contact.name || 'Без имени' }}</h3>
            <p v-if="contact.tel">{{ contact.tel }}</p>
            <p v-if="contact.email">{{ contact.email }}</p>
          </ion-label>
          
          <ion-button 
            slot="end" 
            fill="clear" 
            color="danger"
            @click="removeContact(index)"
          >
            <ion-icon :icon="closeOutline"></ion-icon>
          </ion-button>
        </ion-item>
      </ion-list>
    </div>

    <!-- Альтернативный способ добавления контактов -->
    <div class="manual-contact">
      <h4>Добавить контакт вручную</h4>
      
      <ion-item>
        <ion-label position="stacked">Имя</ion-label>
        <ion-input 
          v-model="manualContact.name"
          placeholder="Введите имя"
        ></ion-input>
      </ion-item>
      
      <ion-item>
        <ion-label position="stacked">Телефон</ion-label>
        <ion-input 
          v-model="manualContact.tel"
          type="tel"
          placeholder="+7-999-123-45-67"
        ></ion-input>
      </ion-item>
      
      <ion-item>
        <ion-label position="stacked">Email</ion-label>
        <ion-input 
          v-model="manualContact.email"
          type="email"
          placeholder="email@example.com"
        ></ion-input>
      </ion-item>
      
      <ion-button 
        expand="block" 
        @click="addManualContact"
        :disabled="!manualContact.name"
      >
        <ion-icon :icon="addOutline" slot="start"></ion-icon>
        Добавить контакт
      </ion-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import {
  IonButton,
  IonIcon,
  IonList,
  IonItem,
  IonLabel,
  IonAvatar,
  IonInput
} from '@ionic/vue';
import {
  peopleOutline,
  personOutline,
  closeOutline,
  addOutline
} from 'ionicons/icons';

// Интерфейс контакта
interface Contact {
  name?: string;
  tel?: string;
  email?: string;
}

// Props
interface Props {
  modelValue?: Contact[];
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => []
});

// Emits
const emit = defineEmits<{
  'update:modelValue': [contacts: Contact[]];
}>();

// Состояние
const selectedContacts = ref<Contact[]>([]);
const isContactPickerSupported = ref(false);
const manualContact = ref<Contact>({
  name: '',
  tel: '',
  email: ''
});

// Проверяем поддержку Contact Picker API
onMounted(() => {
  checkContactPickerSupport();
});

const checkContactPickerSupport = () => {
  // Проверяем поддержку Contact Picker API
  if ('contacts' in navigator && 'ContactsManager' in window) {
    isContactPickerSupported.value = true;
    console.log('✅ Contact Picker API поддерживается');
  } else {
    console.log('❌ Contact Picker API не поддерживается');
    
    // Проверяем альтернативные способы
    if (navigator.share && typeof navigator.share === 'function') {
      console.log('✅ Web Share API поддерживается');
    }
  }
};

// Импорт контактов через Contact Picker API
const importContacts = async () => {
  try {
    console.log('📱 Импорт контактов...');
    
    if (!isContactPickerSupported.value) {
      console.log('❌ Contact Picker API не поддерживается');
      alert('Импорт контактов недоступен в этом браузере. Используйте ручное добавление.');
      return;
    }

    // Запрашиваем контакты
    const contacts = await (navigator as any).contacts.select([
      'name', 
      'tel', 
      'email'
    ], { multiple: true });

    console.log('📞 Получены контакты:', contacts);
    
    if (contacts && contacts.length > 0) {
      // Обрабатываем полученные контакты
      const processedContacts = contacts.map((contact: any) => ({
        name: contact.name?.[0] || '',
        tel: contact.tel?.[0] || '',
        email: contact.email?.[0] || ''
      }));

      // Добавляем к существующим контактам
      selectedContacts.value = [...selectedContacts.value, ...processedContacts];
      emit('update:modelValue', selectedContacts.value);
      
      console.log('✅ Контакты добавлены:', processedContacts.length);
    }
    
  } catch (error) {
    console.error('❌ Ошибка при импорте контактов:', error);
    alert('Ошибка при импорте контактов. Попробуйте добавить контакты вручную.');
  }
};

// Удаление контакта
const removeContact = (index: number) => {
  selectedContacts.value.splice(index, 1);
  emit('update:modelValue', selectedContacts.value);
  console.log('🗑️ Контакт удален:', index);
};

// Добавление контакта вручную
const addManualContact = () => {
  if (!manualContact.value.name) {
    alert('Введите имя контакта');
    return;
  }

  const newContact: Contact = {
    name: manualContact.value.name,
    tel: manualContact.value.tel || undefined,
    email: manualContact.value.email || undefined
  };

  selectedContacts.value.push(newContact);
  emit('update:modelValue', selectedContacts.value);
  
  // Очищаем форму
  manualContact.value = {
    name: '',
    tel: '',
    email: ''
  };
  
  console.log('✅ Контакт добавлен вручную:', newContact);
};

// Синхронизация с внешними изменениями
const syncContacts = () => {
  if (props.modelValue) {
    selectedContacts.value = [...props.modelValue];
  }
};

// Отслеживаем изменения props
watch(() => props.modelValue, syncContacts, { immediate: true });
</script>

<style scoped>
.contact-picker {
  margin: 16px 0;
}

.selected-contacts {
  margin-top: 16px;
}

.selected-contacts h4 {
  margin: 16px 0 8px 0;
  color: var(--ion-color-primary);
}

.contact-item {
  --padding-start: 0;
  margin-bottom: 8px;
}

.contact-item ion-avatar {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--ion-color-light);
}

.contact-item ion-avatar ion-icon {
  font-size: 20px;
  color: var(--ion-color-medium);
}

.manual-contact {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid var(--ion-color-light);
}

.manual-contact h4 {
  margin: 0 0 16px 0;
  color: var(--ion-color-primary);
}

.manual-contact ion-item {
  --padding-start: 0;
  margin-bottom: 8px;
}
</style>
