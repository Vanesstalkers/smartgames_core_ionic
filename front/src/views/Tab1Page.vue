<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Главная</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="openAddEventModal">
            <ion-icon :icon="add"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    
    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Памятные даты</ion-title>
        </ion-toolbar>
      </ion-header>

      <!-- Управление балансом -->
      <BalanceCard />

      <!-- Компактная статистика -->
      <div class="compact-stats">
        <ion-card>
          <ion-card-content>
            <div class="stats-row">
              <div class="stat-item">
                <ion-icon :icon="calendarOutline" color="primary"></ion-icon>
                <span>{{ totalEvents }}</span>
                <small>Всего</small>
              </div>
              <div class="stat-item">
                <ion-icon :icon="notificationsOutline" color="warning"></ion-icon>
                <span>{{ upcomingEvents.length }}</span>
                <small>Предстоящих</small>
              </div>
              <div class="stat-item">
                <ion-icon :icon="heartOutline" color="danger"></ion-icon>
                <span>{{ importantEvents }}</span>
                <small>Важных</small>
              </div>
            </div>
          </ion-card-content>
        </ion-card>
      </div>

      <!-- Компактные фильтры -->
      <div class="compact-filters">
        <ion-card>
          <ion-card-content>
            <div class="filters-row">
              <ion-searchbar v-model="searchQuery" placeholder="Поиск событий" class="compact-search" />
              <ion-select v-model="selectedCategory" placeholder="Категория" interface="popover">
                <ion-select-option value="">Все</ion-select-option>
                <ion-select-option v-for="c in categories" :key="c" :value="c">{{ c }}</ion-select-option>
              </ion-select>
              <ion-button 
                :fill="showImportantOnly ? 'solid' : 'outline'" 
                :color="showImportantOnly ? 'warning' : 'medium'"
                @click="showImportantOnly = !showImportantOnly"
                size="small"
              >
                <ion-icon :icon="heartOutline" slot="start"></ion-icon>
                Важные
              </ion-button>
            </div>
          </ion-card-content>
        </ion-card>
      </div>

      <!-- Ближайшие события -->
      <div class="upcoming-events">
        <ion-card>
          <ion-card-header>
            <ion-card-title>Ближайшие события</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <div v-if="upcomingEvents.length === 0" class="empty-state">
              <ion-icon :icon="calendarOutline" size="large"></ion-icon>
              <p>Нет предстоящих событий</p>
              <ion-button fill="outline" @click="openAddEventModal">
                Добавить событие
              </ion-button>
            </div>
            <EventCard 
              v-for="event in upcomingEvents" 
              :key="event.id" 
              :event="event"
              @edit="editEvent"
              @delete="deleteEvent"
            />
          </ion-card-content>
        </ion-card>
      </div>

      <!-- Компактные быстрые действия -->
      <div class="quick-actions">
        <ion-card>
          <ion-card-content>
            <div class="actions-grid">
              <ion-button expand="block" fill="outline" @click="openAddEventModal" class="action-button">
                <ion-icon :icon="add" slot="start"></ion-icon>
                Добавить
              </ion-button>
              <ion-button expand="block" fill="outline" router-link="/tabs/calendar" class="action-button">
                <ion-icon :icon="calendar" slot="start"></ion-icon>
                Календарь
              </ion-button>
              <ion-button expand="block" fill="outline" router-link="/tabs/events" class="action-button">
                <ion-icon :icon="list" slot="start"></ion-icon>
                Все события
              </ion-button>
              <ion-button expand="block" fill="outline" router-link="/tabs/settings" class="action-button">
                <ion-icon :icon="settings" slot="start"></ion-icon>
                Настройки
              </ion-button>
            </div>
          </ion-card-content>
        </ion-card>
      </div>
    </ion-content>

    <!-- Модальное окно добавления события -->
    <AddEventModal 
      :is-open="isAddEventModalOpen"
      :editing-event="editingEvent"
      @close="closeAddEventModal"
      @save="saveEvent"
    />
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { 
  IonPage, 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent, 
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButtons,
  IonButton,
  IonIcon,
} from '@ionic/vue';
import { 
  add, 
  calendarOutline, 
  notificationsOutline, 
  heartOutline,
  calendar,
  list,
  settings
} from 'ionicons/icons';
import { defineAsyncComponent } from 'vue';
import { IonSearchbar, IonSelect, IonSelectOption } from '@ionic/vue';
import EventCard from '@/components/EventCard.vue';
import BalanceCard from '@/components/BalanceCard.vue';
const AddEventModal = defineAsyncComponent(() => import('../components/AddEventModal.vue'));
import eventsStore from '@/store/events';

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

// Состояние
const isAddEventModalOpen = ref(false);
const editingEvent = ref<MemorialEvent | null>(null);
const events = eventsStore.events;
// Filters
const searchQuery = ref('');
const selectedCategory = ref(''); // empty = all
const showImportantOnly = ref(false);

// Вычисляемые свойства
const upcomingEvents = computed(() => {
  const today = new Date();
  const next30Days = new Date();
  next30Days.setDate(today.getDate() + 30);

  const q = searchQuery.value.trim().toLowerCase();
  const cat = selectedCategory.value;
  const importantOnly = showImportantOnly.value;

  return events.value
    .filter(event => {
      const eventDate = new Date(event.date);
      if (!(eventDate >= today && eventDate <= next30Days)) return false;
      if (importantOnly && !event.isImportant) return false;
      if (cat && event.category !== cat) return false;
      if (q) {
        const inTitle = event.title.toLowerCase().includes(q);
        const inCategory = event.category.toLowerCase().includes(q);
        const inDesc = (event.description || '').toLowerCase().includes(q);
        if (!(inTitle || inCategory || inDesc)) return false;
      }
      return true;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 50); // show more results in dashboard
});

// Derived categories from events
const categories = computed(() => {
  const set = new Set<string>();
  events.value.forEach(e => set.add(e.category));
  return Array.from(set).sort();
});

const totalEvents = computed(() => events.value.length);

const importantEvents = computed(() => 
  events.value.filter(event => event.isImportant).length
);

// Методы
const openAddEventModal = () => {
  editingEvent.value = null;
  isAddEventModalOpen.value = true;
};

const closeAddEventModal = () => {
  isAddEventModalOpen.value = false;
  editingEvent.value = null;
};

const saveEvent = (eventData: Omit<MemorialEvent, 'id'>) => {
  if (editingEvent.value) {
    const updated: MemorialEvent = { ...eventData, id: editingEvent.value.id };
    eventsStore.updateEvent(updated);
  } else {
    eventsStore.addEvent(eventData);
  }
  closeAddEventModal();
};

const editEvent = (eventId: string) => {
  const event = events.value.find(e => e.id === eventId);
  if (event) {
    editingEvent.value = event;
    isAddEventModalOpen.value = true;
  }
};

const deleteEvent = (eventId: string) => {
  if (confirm('Вы уверены, что хотите удалить это событие?')) {
    const index = events.value.findIndex(event => event.id === eventId);
    if (index > -1) {
      events.value.splice(index, 1);
    }
  }
};

// Загрузка данных при монтировании
onMounted(() => {
  // Инициализируем тестовые данные, если localStorage пуст
  eventsStore.ensureSampleData();
});
</script>

<style scoped>
.compact-stats,
.compact-filters,
.upcoming-events,
.quick-actions {
  margin: 8px;
}

/* Компактная статистика */
.stats-row {
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 8px 0;
}

.stats-row .stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  text-align: center;
}

.stats-row .stat-item ion-icon {
  font-size: 20px;
}

.stats-row .stat-item span {
  font-size: 18px;
  font-weight: bold;
  color: var(--ion-color-dark);
}

.stats-row .stat-item small {
  font-size: 11px;
  color: var(--ion-color-medium);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Компактные фильтры */
.filters-row {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.compact-search {
  flex: 1;
  min-width: 200px;
}

.filters-row ion-select {
  min-width: 120px;
}

/* Быстрые действия */
.actions-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.action-button {
  height: 48px;
  font-size: 14px;
}

/* Общие стили */
.empty-state {
  text-align: center;
  padding: 24px 16px;
  color: var(--ion-color-medium);
}

.empty-state ion-icon {
  margin-bottom: 12px;
}

/* Адаптивность */
@media (max-width: 768px) {
  .actions-grid {
    grid-template-columns: 1fr;
  }
  
  .filters-row {
    flex-direction: column;
    align-items: stretch;
  }
  
  .compact-search {
    min-width: auto;
  }
}
</style>
