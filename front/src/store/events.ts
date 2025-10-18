import { ref, watch } from 'vue';

export interface MemorialEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  description?: string;
  category: string;
  isImportant: boolean;
  reminderDays: number[];
  color: string;
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

// Простая инициализация тестовыми данными, вызывается только если хранилище пустое
function ensureSampleData() {
  if (events.value.length === 0) {
    const now = new Date();
    const sample: MemorialEvent[] = [
      {
        id: '1',
        title: 'День рождения мамы',
        date: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7).toISOString().slice(0, 10),
        description: 'День рождения самого дорогого человека',
        category: 'Семья',
        isImportant: true,
        reminderDays: [7, 1],
        color: '#ff6b6b'
      },
      {
        id: '2',
        title: 'Годовщина свадьбы',
        date: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 30).toISOString().slice(0, 10),
        description: 'Празднование',
        category: 'Семья',
        isImportant: true,
        reminderDays: [30, 7, 1],
        color: '#4ecdc4'
      }
    ];
    events.value = sample;
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
  ensureSampleData
};
