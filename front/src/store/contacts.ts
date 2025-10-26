import { ref, watch } from 'vue';
import eventsStore from './events';

export interface Contact {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  notes?: string;
  category?: string; // Семья, Друзья, Коллеги, Другое
  avatar?: string; // URL аватара или инициалы
  birthday?: string; // ISO дата рождения
  isFavorite: boolean;
  createdAt: string; // ISO дата создания
  updatedAt: string; // ISO дата обновления
}

const LS_KEY = 'sg_contacts_v1';

const contacts = ref<Contact[]>([]);

function load() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      contacts.value = JSON.parse(raw) as Contact[];
    } else {
      contacts.value = [];
    }
  } catch (e) {
    console.error('Failed to load contacts from localStorage', e);
    contacts.value = [];
  }
}

function save() {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(contacts.value));
  } catch (e) {
    console.error('Failed to save contacts to localStorage', e);
  }
}

// Инициализация тестовыми данными
function ensureSampleData() {
  if (contacts.value.length === 0) {
    const sampleContacts: Contact[] = [
      {
        id: '1',
        name: 'Анна Петрова',
        phone: '+7 (999) 123-45-67',
        email: 'anna.petrova@example.com',
        notes: 'Сестра, день рождения 15 марта',
        category: 'Семья',
        birthday: '1990-03-15',
        isFavorite: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '2',
        name: 'Михаил Иванов',
        phone: '+7 (999) 234-56-78',
        email: 'mikhail.ivanov@example.com',
        notes: 'Коллега по работе',
        category: 'Коллеги',
        birthday: '1985-07-22',
        isFavorite: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '3',
        name: 'Елена Смирнова',
        phone: '+7 (999) 345-67-89',
        email: 'elena.smirnova@example.com',
        notes: 'Лучшая подруга',
        category: 'Друзья',
        birthday: '1992-12-10',
        isFavorite: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
    
    contacts.value = sampleContacts;
    save();
  }
}

function addContact(contactData: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>) {
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const now = new Date().toISOString();
  const contact: Contact = { 
    ...contactData, 
    id,
    createdAt: now,
    updatedAt: now
  };
  contacts.value.push(contact);
  save();
  
  // Создаем событие дня рождения, если указана дата рождения
  if (contact.birthday) {
    eventsStore.createBirthdayEvent(contact);
  }
  
  return contact;
}

function updateContact(updated: Contact) {
  const idx = contacts.value.findIndex(c => c.id === updated.id);
  if (idx > -1) {
    const oldContact = contacts.value[idx];
    contacts.value[idx] = { 
      ...updated, 
      updatedAt: new Date().toISOString() 
    };
    save();
    
    // Обновляем событие дня рождения, если изменилась дата рождения
    if (oldContact.birthday !== updated.birthday) {
      eventsStore.updateBirthdayEvent(updated);
    }
    
    return true;
  }
  return false;
}

function deleteContact(id: string) {
  const idx = contacts.value.findIndex(c => c.id === id);
  if (idx > -1) {
    contacts.value.splice(idx, 1);
    save();
    return true;
  }
  return false;
}

function toggleFavorite(id: string) {
  const contact = contacts.value.find(c => c.id === id);
  if (contact) {
    contact.isFavorite = !contact.isFavorite;
    contact.updatedAt = new Date().toISOString();
    save();
    return true;
  }
  return false;
}

// Получить контакты по категории
function getContactsByCategory(category: string) {
  return contacts.value.filter(c => c.category === category);
}

// Получить избранные контакты
function getFavoriteContacts() {
  return contacts.value.filter(c => c.isFavorite);
}

// Поиск контактов
function searchContacts(query: string) {
  const lowerQuery = query.toLowerCase();
  return contacts.value.filter(c => 
    c.name.toLowerCase().includes(lowerQuery) ||
    c.phone?.toLowerCase().includes(lowerQuery) ||
    c.email?.toLowerCase().includes(lowerQuery) ||
    c.notes?.toLowerCase().includes(lowerQuery)
  );
}

// Получить все категории
function getCategories() {
  const categories = new Set(contacts.value.map(c => c.category).filter(Boolean));
  return Array.from(categories);
}

// Следим за изменениями и сохраняем
watch(contacts, () => save(), { deep: true });

// Инициализация при загрузке модуля
load();

export default {
  contacts,
  load,
  save,
  addContact,
  updateContact,
  deleteContact,
  toggleFavorite,
  getContactsByCategory,
  getFavoriteContacts,
  searchContacts,
  getCategories,
  ensureSampleData
};
