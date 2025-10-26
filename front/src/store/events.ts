import { ref, watch } from 'vue';
import { createSampleEvents } from '@/data/sampleEvents';
import contactsStore from './contacts';

export interface MemorialEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  description?: string;
  category: string;
  isImportant: boolean;
  reminderDays: number[];
  color: string;
  budget?: number; // Бюджет для события
  spent?: number; // Потрачено на событие
  contacts?: Contact[]; // Список контактов для поздравления
  relatedContactId?: string; // ID связанного контакта (для дней рождения)
}

export interface Contact {
  id?: string;
  name?: string;
  tel?: string;
  email?: string;
}

const LS_KEY = 'sg_events_v1';

const events = ref<MemorialEvent[]>([]);

function load() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      events.value = JSON.parse(raw) as MemorialEvent[];
    } else {
      events.value = [];
    }
  } catch (e) {
    console.error('Failed to load events from localStorage', e);
    events.value = [];
  }
}

function save() {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(events.value));
  } catch (e) {
    console.error('Failed to save events to localStorage', e);
  }
}

// Инициализация тестовыми данными, вызывается только если хранилище пустое
function ensureSampleData() {
  if (events.value.length === 0) {
    const sampleEvents = createSampleEvents();
    const sampleWithIds: MemorialEvent[] = sampleEvents.map((event, index) => ({
      ...event,
      id: (index + 1).toString()
    }));
    
    events.value = sampleWithIds;
    save();
  }
}

function addEvent(eventData: Omit<MemorialEvent, 'id'>) {
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const ev: MemorialEvent = { ...eventData, id };
  events.value.push(ev);
  save();
  return ev.id;
}

function updateEvent(updated: MemorialEvent) {
  const idx = events.value.findIndex(e => e.id === updated.id);
  if (idx > -1) {
    events.value[idx] = { ...updated };
    save();
    return true;
  }
  return false;
}

function deleteEvent(id: string) {
  const idx = events.value.findIndex(e => e.id === id);
  if (idx > -1) {
    events.value.splice(idx, 1);
    save();
    return true;
  }
  return false;
}

// Получить контакты для события
function getEventContacts(eventId: string) {
  const event = events.value.find(e => e.id === eventId);
  if (!event || !event.contacts) return [];
  
  return event.contacts.map(contact => {
    // Если контакт имеет только базовую информацию, попробуем найти полный контакт в store
    if (contact.name && !contact.id) {
      const fullContact = contactsStore.contacts.value.find(c => 
        c.name === contact.name && 
        (c.phone === contact.tel || c.email === contact.email)
      );
      return fullContact || contact;
    }
    return contact;
  });
}

// Добавить контакт к событию
function addContactToEvent(eventId: string, contact: Contact) {
  const event = events.value.find(e => e.id === eventId);
  if (event) {
    if (!event.contacts) {
      event.contacts = [];
    }
    
    // Проверяем, не добавлен ли уже этот контакт
    const existingContact = event.contacts.find(c => 
      c.name === contact.name && 
      (c.tel === contact.tel || c.email === contact.email)
    );
    
    if (!existingContact) {
      event.contacts.push({
        name: contact.name,
        tel: contact.tel,
        email: contact.email
      });
      save();
    }
  }
}

// Удалить контакт из события
function removeContactFromEvent(eventId: string, contactName: string) {
  const event = events.value.find(e => e.id === eventId);
  if (event && event.contacts) {
    const index = event.contacts.findIndex(c => c.name === contactName);
    if (index > -1) {
      event.contacts.splice(index, 1);
      save();
    }
  }
}

// Создание события дня рождения для контакта
function createBirthdayEvent(contact: any): string {
  if (!contact.birthday) {
    return '';
  }
  
  const birthdayDate = new Date(contact.birthday + 'T12:00:00.000Z'); // Создаем в UTC
  const currentYear = new Date().getFullYear();
  
  // Устанавливаем текущий год для дня рождения
  const thisYearBirthday = new Date(Date.UTC(currentYear, birthdayDate.getUTCMonth(), birthdayDate.getUTCDate()));
  
  // Если день рождения уже прошел в этом году, берем следующий год
  const today = new Date();
  const todayUTC = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
  
  if (thisYearBirthday < todayUTC) {
    thisYearBirthday.setUTCFullYear(currentYear + 1);
  }
  
  const eventId = `birthday_${contact.id}_${Date.now()}`;
  const event: MemorialEvent = {
    id: eventId,
    title: `День рождения: ${contact.name}`,
    date: thisYearBirthday.toISOString().split('T')[0],
    description: `Поздравить ${contact.name} с днем рождения`,
    category: 'День рождения',
    isImportant: true,
    reminderDays: [7, 1], // Напоминания за неделю и за день
    color: 'primary',
    budget: 0,
    spent: 0,
    relatedContactId: contact.id
  };
  
  events.value.push(event);
  save();
  return eventId;
}

// Обновление события дня рождения при изменении контакта
function updateBirthdayEvent(contact: any) {
  if (!contact.birthday) {
    // Удаляем событие дня рождения, если дата рождения удалена
    events.value = events.value.filter(e => e.relatedContactId !== contact.id);
    save();
    return;
  }
  
  // Ищем существующее событие дня рождения
  const existingEvent = events.value.find(e => e.relatedContactId === contact.id);
  
  if (existingEvent) {
    // Обновляем существующее событие
    const birthdayDate = new Date(contact.birthday + 'T12:00:00.000Z'); // Создаем в UTC
    const currentYear = new Date().getFullYear();
    const thisYearBirthday = new Date(Date.UTC(currentYear, birthdayDate.getUTCMonth(), birthdayDate.getUTCDate()));
    
    const today = new Date();
    const todayUTC = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
    
    if (thisYearBirthday < todayUTC) {
      thisYearBirthday.setUTCFullYear(currentYear + 1);
    }
    
    existingEvent.title = `День рождения: ${contact.name}`;
    existingEvent.date = thisYearBirthday.toISOString().split('T')[0];
    existingEvent.description = `Поздравить ${contact.name} с днем рождения`;
  } else {
    // Создаем новое событие
    createBirthdayEvent(contact);
  }
  
  save();
}

// Получение события дня рождения для контакта
function getBirthdayEvent(contactId: string): MemorialEvent | undefined {
  return events.value.find(e => e.relatedContactId === contactId);
}

// Следим за изменениями и сохраняем
watch(events, () => save(), { deep: true });

// Инициализация при загрузке модуля
load();

export default {
  events,
  load,
  save,
  addEvent,
  updateEvent,
  deleteEvent,
  ensureSampleData,
  getEventContacts,
  addContactToEvent,
  removeContactFromEvent,
  createBirthdayEvent,
  updateBirthdayEvent,
  getBirthdayEvent
};
