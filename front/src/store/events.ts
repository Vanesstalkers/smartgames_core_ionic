import { ref, watch } from 'vue';
import { createSampleEvents } from '@/data/sampleEvents';

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
