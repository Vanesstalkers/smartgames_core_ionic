<template>
  <div class="contact-picker">
    <!-- Информация о поддержке контактов -->
    <div v-if="!isContactPickerSupported" class="contact-info">
      <ion-note color="medium">
        <ion-icon :icon="peopleOutline" size="small"></ion-icon>
        Импорт контактов недоступен в PWA. Используйте ручное добавление ниже.
      </ion-note>
    </div>

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
import { Contacts } from '@capacitor-community/contacts';

// Типизация для Capacitor
declare global {
  interface Window {
    Capacitor?: any;
  }
}

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

const checkContactPickerSupport = async () => {
  try {
    console.log('🔍 Проверяем поддержку контактов...');
    console.log('User Agent:', navigator.userAgent);
    console.log('Is PWA:', window.matchMedia('(display-mode: standalone)').matches);
    
    // Проверяем Capacitor Contacts (только для нативных приложений)
    if (Contacts && window.Capacitor) {
      try {
        const permissions = await Contacts.checkPermissions();
        console.log('📱 Capacitor Contacts permissions:', permissions);
        if (permissions.contacts === 'granted') {
          isContactPickerSupported.value = true;
          console.log('✅ Capacitor Contacts поддерживается и разрешен');
          return;
        }
      } catch (capacitorError) {
        console.log('❌ Capacitor Contacts недоступен в PWA:', capacitorError);
      }
    }
    
    // Проверяем поддержку Contact Picker API (только для некоторых браузеров)
    if ('contacts' in navigator && 'ContactsManager' in window) {
      const contactsManager = (navigator as any).contacts;
      if (contactsManager && typeof contactsManager.select === 'function') {
        isContactPickerSupported.value = true;
        console.log('✅ Contact Picker API поддерживается');
        return;
      }
    }
    
    // Проверяем Web Share API (альтернатива для мобильных)
    if (navigator.share && typeof navigator.share === 'function') {
      console.log('✅ Web Share API поддерживается');
      isContactPickerSupported.value = true;
      return;
    }
    
    console.log('❌ Ни один из методов работы с контактами не поддерживается');
    isContactPickerSupported.value = false;
    
  } catch (error) {
    console.log('❌ Ошибка при проверке поддержки контактов:', error);
    isContactPickerSupported.value = false;
  }
};

// Импорт контактов через различные методы
const importContacts = async () => {
  try {
    console.log('📱 Импорт контактов...');
    console.log('🔍 Доступные методы:', {
      hasCapacitor: !!window.Capacitor,
      hasContacts: !!Contacts,
      hasContactPicker: 'contacts' in navigator && 'ContactsManager' in window,
      hasWebShare: !!navigator.share
    });
    
    // Метод 1: Capacitor Contacts (только для нативных приложений)
    if (Contacts && window.Capacitor) {
      try {
        console.log('📱 Пробуем Capacitor Contacts...');
        const permissions = await Contacts.requestPermissions();
        console.log('📱 Permissions result:', permissions);
        
        if (permissions.contacts === 'granted') {
          const result = await Contacts.getContacts({
            projection: {
              name: true,
              phones: true,
              emails: true
            }
          });

          console.log('📞 Получены контакты через Capacitor:', result.contacts);
          
          if (result.contacts && result.contacts.length > 0) {
            const processedContacts = result.contacts.map((contact: any) => ({
              name: contact.name?.display || contact.name?.given || '',
              tel: contact.phones?.[0]?.number || '',
              email: contact.emails?.[0]?.address || ''
            })).filter(contact => contact.name);

            selectedContacts.value = [...selectedContacts.value, ...processedContacts];
            emit('update:modelValue', selectedContacts.value);
            
            console.log('✅ Контакты добавлены через Capacitor:', processedContacts.length);
            return;
          }
        } else {
          console.log('❌ Разрешение на контакты не предоставлено');
          alert('Необходимо разрешение на доступ к контактам. Проверьте настройки приложения.');
          return;
        }
      } catch (capacitorError) {
        console.log('❌ Capacitor Contacts недоступен:', capacitorError);
      }
    }

    // Метод 2: Contact Picker API (только для некоторых браузеров)
    if ('contacts' in navigator && 'ContactsManager' in window && isContactPickerSupported.value) {
      try {
        console.log('🌐 Пробуем Contact Picker API...');
        const contactsManager = (navigator as any).contacts;
        
        if (!contactsManager || typeof contactsManager.select !== 'function') {
          throw new Error('Contact Picker API не функционален');
        }
        
        const contacts = await contactsManager.select([
          'name', 
          'tel', 
          'email'
        ], { multiple: true });

        console.log('📞 Получены контакты через Contact Picker API:', contacts);
        
        if (contacts && contacts.length > 0) {
          const processedContacts = contacts.map((contact: any) => ({
            name: contact.name?.[0] || '',
            tel: contact.tel?.[0] || '',
            email: contact.email?.[0] || ''
          }));

          selectedContacts.value = [...selectedContacts.value, ...processedContacts];
          emit('update:modelValue', selectedContacts.value);
          
          console.log('✅ Контакты добавлены через Contact Picker API:', processedContacts.length);
          return;
        }
      } catch (pickerError: any) {
        console.log('❌ Contact Picker API недоступен:', pickerError);
        if (pickerError.message && pickerError.message.includes('Not implemented on web')) {
          console.log('❌ Contact Picker API не реализован в веб-версии браузера');
        }
      }
    }

    // Метод 3: Web Share API (альтернатива для мобильных)
    if (navigator.share && typeof navigator.share === 'function') {
      try {
        console.log('📤 Пробуем Web Share API...');
        await navigator.share({
          title: 'Поделиться контактом',
          text: 'Поделитесь контактной информацией',
          url: window.location.href
        });
        console.log('✅ Web Share API работает');
        alert('Используйте функцию "Поделиться" вашего браузера для добавления контактов.');
        return;
      } catch (shareError) {
        console.log('❌ Web Share API недоступен:', shareError);
      }
    }

    // Если ничего не сработало
    console.log('❌ Все методы недоступны');
    alert('Импорт контактов недоступен в вашем браузере. Используйте ручное добавление контактов.');
    
  } catch (error) {
    console.error('❌ Общая ошибка при импорте контактов:', error);
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

.contact-info {
  margin-bottom: 16px;
  padding: 12px;
  background: rgba(var(--ion-color-light-rgb), 0.5);
  border-radius: 8px;
  border-left: 4px solid var(--ion-color-warning);
}

.contact-info ion-note {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
}
</style>
