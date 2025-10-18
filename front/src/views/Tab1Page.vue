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

      <!-- Статистика -->
      <div class="stats-section">
        <ion-card>
          <ion-card-header>
            <ion-card-title>Статистика</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <div class="stats-grid">
              <div class="stat-item">
                <ion-icon :icon="calendarOutline" color="primary"></ion-icon>
                <div>
                  <h3>{{ totalEvents }}</h3>
                  <p>Всего событий</p>
                </div>
              </div>
              <div class="stat-item">
                <ion-icon :icon="notificationsOutline" color="warning"></ion-icon>
                <div>
                  <h3>{{ upcomingEvents.length }}</h3>
                  <p>Предстоящих</p>
                </div>
              </div>
              <div class="stat-item">
                <ion-icon :icon="heartOutline" color="danger"></ion-icon>
                <div>
                  <h3>{{ importantEvents }}</h3>
                  <p>Важных</p>
                </div>
              </div>
            </div>
          </ion-card-content>
        </ion-card>
      </div>

      <!-- Быстрые действия -->
      <div class="quick-actions">
        <ion-card>
          <ion-card-header>
            <ion-card-title>Быстрые действия</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ion-grid>
              <ion-row>
                <ion-col size="6">
                  <ion-button expand="block" fill="outline" @click="openAddEventModal">
                    <ion-icon :icon="add" slot="start"></ion-icon>
                    Добавить событие
                  </ion-button>
                </ion-col>
                <ion-col size="6">
                  <ion-button expand="block" fill="outline" router-link="/tabs/calendar">
                    <ion-icon :icon="calendar" slot="start"></ion-icon>
                    Календарь
                  </ion-button>
                </ion-col>
              </ion-row>
              <ion-row>
                <ion-col size="6">
                  <ion-button expand="block" fill="outline" router-link="/tabs/events">
                    <ion-icon :icon="list" slot="start"></ion-icon>
                    Все события
                  </ion-button>
                </ion-col>
                <ion-col size="6">
                  <ion-button expand="block" fill="outline" router-link="/tabs/settings">
                    <ion-icon :icon="settings" slot="start"></ion-icon>
                    Настройки
                  </ion-button>
                </ion-col>
              </ion-row>
            </ion-grid>
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
  IonGrid,
  IonRow,
  IonCol
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

const EventCard = defineAsyncComponent(() => import('../components/EventCard.vue'));
const AddEventModal = defineAsyncComponent(() => import('../components/AddEventModal.vue'));

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
const events = ref<MemorialEvent[]>([]);

// Вычисляемые свойства
const upcomingEvents = computed(() => {
  const today = new Date();
  const next30Days = new Date();
  next30Days.setDate(today.getDate() + 30);
  
  return events.value
    .filter(event => {
      const eventDate = new Date(event.date);
      return eventDate >= today && eventDate <= next30Days;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);
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
    // Редактирование существующего события
    const index = events.value.findIndex(event => event.id === editingEvent.value!.id);
    if (index > -1) {
      events.value[index] = { ...eventData, id: editingEvent.value.id };
    }
  } else {
    // Добавление нового события
    const newEvent: MemorialEvent = {
      ...eventData,
      id: Date.now().toString()
    };
    events.value.push(newEvent);
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
  // Загружаем тестовые данные
  events.value = [
    {
      id: '1',
      title: 'День рождения мамы',
      date: '2024-02-15',
      description: 'День рождения самого дорогого человека',
      category: 'Семья',
      isImportant: true,
      reminderDays: [7, 1],
      color: '#ff6b6b'
    },
    {
      id: '2',
      title: 'Годовщина свадьбы',
      date: '2024-03-20',
      description: '5 лет вместе',
      category: 'Семья',
      isImportant: true,
      reminderDays: [30, 7, 1],
      color: '#4ecdc4'
    },
    {
      id: '3',
      title: 'День памяти дедушки',
      date: '2024-01-30',
      description: 'Памятная дата',
      category: 'Память',
      isImportant: false,
      reminderDays: [1],
      color: '#95a5a6'
    },
    {
      id: '4',
      title: 'День рождения друга',
      date: '2024-12-25',
      description: 'День рождения лучшего друга',
      category: 'Друзья',
      isImportant: false,
      reminderDays: [7, 1],
      color: '#45b7d1'
    }
  ];
});
</script>

<style scoped>
.upcoming-events,
.stats-section,
.quick-actions {
  margin: 16px;
}

.empty-state {
  text-align: center;
  padding: 32px 16px;
  color: var(--ion-color-medium);
}

.empty-state ion-icon {
  margin-bottom: 16px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 16px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 12px;
  text-align: left;
}

.stat-item ion-icon {
  font-size: 24px;
}

.stat-item h3 {
  margin: 0;
  font-size: 24px;
  font-weight: bold;
}

.stat-item p {
  margin: 0;
  font-size: 12px;
  color: var(--ion-color-medium);
}
</style>
