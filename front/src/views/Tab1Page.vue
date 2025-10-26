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
      <!-- <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Памятные даты</ion-title>
        </ion-toolbar>
      </ion-header> -->

      <!-- Управление балансом -->
      <BalanceCard />

      <!-- PWA компоненты -->
      <PWAInstallPrompt />
      <PWAStatus />
      <PWAInstallInstructions />

      <!-- Убрали компактные фильтры - теперь они в Bottom Sheet -->

      <!-- Компактная статистика -->
      <div class="compact-stats">
        <ion-card>
          <ion-card-header>
            <div class="card-header-content">
              <ion-card-title>События</ion-card-title>
              <ion-button 
                v-if="hasActiveFilters" 
                fill="clear" 
                size="small" 
                @click="clearFilters"
                class="clear-filters-btn"
              >
                <ion-icon :icon="refresh" slot="start"></ion-icon>
                Сбросить фильтры
              </ion-button>
            </div>
          </ion-card-header>
          <ion-card-content>
            <div class="stats-row">
              <div class="stat-item">
                <ion-icon :icon="calendarOutline" color="primary"></ion-icon>
                <span>{{ totalEvents }}</span>
                <small>Всего</small>
              </div>
              <div class="stat-item">
                <ion-icon :icon="heartOutline" color="danger"></ion-icon>
                <span>{{ importantEvents }}</span>
                <small>Важных</small>
              </div>
              <div class="stat-item">
                <ion-icon :icon="notificationsOutline" color="warning"></ion-icon>
                <span>{{ upcomingEvents.length }}</span>
                <small>Скоро</small>
              </div>
            </div>
            <div v-if="upcomingEvents.length === 0" class="empty-state">
              <ion-icon :icon="calendarOutline" size="large"></ion-icon>
              <p>Нет предстоящих событий</p>
              <ion-button @click="openAddEventModal">
                Добавить событие
              </ion-button>
            </div>
            <EventCardCompact 
              v-for="event in upcomingEvents" 
              :key="event.id" 
              :event="event"
              @edit="editEvent"
              @delete="deleteEvent"
            />
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

    <!-- Постоянно видимая ручка Bottom Sheet -->
    <div 
      class="bottom-sheet-handle" 
      @click="openSearchBottomSheet"
      @touchstart="handleTouchStart"
      @touchmove="handleTouchMove"
      @touchend="handleTouchEnd"
      :class="{ 
        'active': hasActiveFilters,
        'modal-open': isSearchBottomSheetOpen,
        'dragging': isDragging
      }"
    >
      <div class="handle-bar"></div>
      <div class="handle-content">
        <ion-icon :icon="search" size="small"></ion-icon>
        <span>Фильтры событий</span>
        <ion-badge v-if="hasActiveFilters" color="primary">{{ getActiveFiltersCount }}</ion-badge>
      </div>  
    </div>

    <!-- Bottom Sheet с поиском и фильтрами -->
    <ion-modal 
      :is-open="isSearchBottomSheetOpen" 
      :initial-breakpoint="0.4" 
      :breakpoints="[0, 0.4, 0.8, 1]"
      @did-dismiss="closeSearchBottomSheet"
    >
      <ion-content>
        <!-- Ручка внутри модального окна -->
        <div 
          class="bottom-sheet-handle-modal" 
          :class="{ 'active': hasActiveFilters }"
        >
          <div class="handle-bar"></div>
          <div class="handle-content">
            <ion-icon :icon="search" size="small"></ion-icon>
            <span>Фильтры событий</span>
            <ion-badge v-if="hasActiveFilters" color="primary">{{ getActiveFiltersCount }}</ion-badge>
          </div>
        </div>
        
        <div class="bottom-sheet-content">
          <div class="search-section">
            <ion-searchbar 
              v-model="searchQuery" 
              placeholder="Поиск событий"
              @ion-input="onSearchInput"
            />
          </div>
          
          <div class="filters-section">
            <ion-item>
              <ion-label>Категория</ion-label>
              <ion-select v-model="selectedCategory" placeholder="Все категории" interface="popover">
                <ion-select-option value="">Все</ion-select-option>
                <ion-select-option v-for="c in categories" :key="c" :value="c">{{ c }}</ion-select-option>
              </ion-select>
            </ion-item>
            
            <ion-item button @click="showImportantOnly = !showImportantOnly">
              <ion-icon :icon="heartOutline" :color="showImportantOnly ? 'warning' : 'medium'"></ion-icon>
              <ion-label>Только важные события</ion-label>
              <ion-checkbox :checked="showImportantOnly" slot="end"></ion-checkbox>
            </ion-item>
          </div>

          <div class="search-actions">
            <ion-button expand="block" fill="outline" @click="clearFilters">
              <ion-icon :icon="refresh" slot="start"></ion-icon>
              Сбросить фильтры
            </ion-button>
            <ion-button expand="block" @click="applyFilters">
              <ion-icon :icon="checkmark" slot="start"></ion-icon>
              Применить
            </ion-button>
          </div>
        </div>
      </ion-content>
    </ion-modal>
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
  IonModal,
  IonItem,
  IonLabel,
  IonCheckbox,
  IonBadge
} from '@ionic/vue';
import { 
  add, 
  calendarOutline, 
  notificationsOutline, 
  heartOutline,
  search,
  refresh,
  checkmark
} from 'ionicons/icons';
import { defineAsyncComponent } from 'vue';
import { IonSearchbar, IonSelect, IonSelectOption } from '@ionic/vue';
import EventCardCompact from '@/components/EventCardCompact.vue';
import BalanceCard from '@/components/BalanceCard.vue';
import PWAInstallPrompt from '@/components/PWAInstallPrompt.vue';
import PWAStatus from '@/components/PWAStatus.vue';
import PWAInstallInstructions from '@/components/PWAInstallInstructions.vue';
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
const isSearchBottomSheetOpen = ref(false);

// Состояние для жестов
const touchStartY = ref(0);
const touchStartTime = ref(0);
const isDragging = ref(false);

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
      // Показываем события начиная с сегодня и в будущем (убираем ограничение в 30 дней)
      if (eventDate < today) return false;
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

// Проверяем, есть ли активные фильтры
const hasActiveFilters = computed(() => {
  return searchQuery.value.trim() !== '' || 
         selectedCategory.value !== '' || 
         showImportantOnly.value;
});

// Подсчитываем количество активных фильтров
const getActiveFiltersCount = computed(() => {
  let count = 0;
  if (searchQuery.value.trim() !== '') count++;
  if (selectedCategory.value !== '') count++;
  if (showImportantOnly.value) count++;
  return count;
});

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
    console.log('Событие обновлено:', updated);
  } else {
    const newId = eventsStore.addEvent(eventData);
    console.log('Событие добавлено с ID:', newId);
    console.log('Все события:', events.value);
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

// Методы для Bottom Sheet поиска
const openSearchBottomSheet = () => {
  isSearchBottomSheetOpen.value = true;
};

const closeSearchBottomSheet = () => {
  isSearchBottomSheetOpen.value = false;
};

const onSearchInput = (event: any) => {
  searchQuery.value = event.detail.value;
};

const clearFilters = () => {
  searchQuery.value = '';
  selectedCategory.value = '';
  showImportantOnly.value = false;
};

const applyFilters = () => {
  // Фильтры уже применяются автоматически через computed свойства
  closeSearchBottomSheet();
};

// Обработчики жестов для ручки Bottom Sheet
const handleTouchStart = (event: TouchEvent) => {
  if (isSearchBottomSheetOpen.value) return;
  
  touchStartY.value = event.touches[0].clientY;
  touchStartTime.value = Date.now();
  isDragging.value = false;
};

const handleTouchMove = (event: TouchEvent) => {
  if (isSearchBottomSheetOpen.value) return;
  
  const currentY = event.touches[0].clientY;
  const deltaY = touchStartY.value - currentY;
  const deltaTime = Date.now() - touchStartTime.value;
  
  // Если свайп вверх больше 30px и быстрее 300ms
  if (deltaY > 30 && deltaTime < 300) {
    isDragging.value = true;
    openSearchBottomSheet();
  }
};

const handleTouchEnd = () => {
  isDragging.value = false;
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
  overflow-x: auto;
  white-space: nowrap;
}

.compact-search {
  width: 100%;
  margin-bottom: 12px;
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
    gap: 6px;
  }
  
  .compact-search {
    margin-bottom: 8px;
  }
}

/* Bottom Sheet стили */
.bottom-sheet-content {
  padding: 16px;
  min-height: 200px;
  margin-top: 0; /* Убираем отступ, так как ручка теперь sticky */
}

.handle {
  width: 40px;
  height: 4px;
  background: var(--ion-color-medium);
  border-radius: 2px;
  margin: 0 auto 16px;
}

.search-section h3 {
  margin: 0 0 16px 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--ion-color-dark);
}

.filters-section {
  margin: 16px 0;
}

.filters-section ion-item {
  --padding-start: 0;
  --padding-end: 0;
  margin-bottom: 8px;
}

.search-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

.search-actions ion-button {
  flex: 1;
}

/* FAB стили */
ion-fab-button {
  --background: var(--ion-color-primary);
  --background-activated: var(--ion-color-primary-shade);
  --background-hover: var(--ion-color-primary-tint);
}

/* Outline стиль для FAB поиска */
.search-fab {
  --background: transparent;
  --background-activated: var(--ion-color-primary-tint);
  --background-hover: var(--ion-color-primary-tint);
  --color: var(--ion-color-primary);
  --border-width: 2px;
  --border-style: solid;
  --border-color: var(--ion-color-primary);
  margin-bottom: 8px; /* Отступ от ручки Bottom Sheet */
}

/* FAB контейнер с отступом от ручки */
ion-fab {
  bottom: 80px; /* Поднимаем FAB выше ручки Bottom Sheet */
}

/* Стили для заголовка карточки с фильтрами */
.card-header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.clear-filters-btn {
  --padding-start: 8px;
  --padding-end: 8px;
  font-size: 12px;
  height: 32px;
}

/* Постоянно видимая ручка Bottom Sheet */
.bottom-sheet-handle {
  position: fixed;
  bottom: 0px;
  left: 0;
  right: 0;
  background: var(--ion-color-light);
  border-top: 1px solid var(--ion-color-light-shade);
  border-radius: 16px 16px 0 0;
  padding: 8px 16px 12px;
  cursor: pointer;
  z-index: 10;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  margin: 0 8px;
  opacity: 1;
  transform: translateY(0);
}

.bottom-sheet-handle:hover {
  background: var(--ion-color-light-shade);
  transform: translateY(-2px);
}

.bottom-sheet-handle.active {
  background: var(--ion-color-primary-tint);
  border-color: var(--ion-color-primary);
}

/* Состояния при открытом модальном окне */
.bottom-sheet-handle.modal-open {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Плавное появление ручки */
.bottom-sheet-handle {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Состояние при перетаскивании */
.bottom-sheet-handle.dragging {
  transform: translateY(-4px) scale(1.02);
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);
  background: var(--ion-color-primary-tint);
}

.handle-bar {
  width: 40px;
  height: 4px;
  background: var(--ion-color-medium);
  border-radius: 2px;
  margin: 0 auto 8px;
}

.handle-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--ion-color-dark);
  font-size: 14px;
  font-weight: 500;
}

.handle-content ion-icon {
  color: var(--ion-color-primary);
}

/* Адаптация для мобильных устройств */
@media (max-width: 768px) {
  .bottom-sheet-handle {
    bottom: 0px;
    margin: 0 4px;
  }
}

/* Ручка внутри модального окна */
.bottom-sheet-handle-modal {
  position: sticky;
  top: 0;
  background: var(--ion-color-light);
  border-bottom: 1px solid var(--ion-color-light-shade);
  border-radius: 0;
  padding: 8px 16px 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 10;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin: 0;
}

.bottom-sheet-handle-modal:hover {
  background: var(--ion-color-light-shade);
}

.bottom-sheet-handle-modal.active {
  background: var(--ion-color-primary-tint);
  border-color: var(--ion-color-primary);
}

.bottom-sheet-handle-modal .handle-bar {
  width: 40px;
  height: 4px;
  background: var(--ion-color-medium);
  border-radius: 2px;
  margin: 0 auto 8px;
}

.bottom-sheet-handle-modal .handle-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--ion-color-dark);
  font-size: 14px;
  font-weight: 500;
}

.bottom-sheet-handle-modal .handle-content ion-icon {
  color: var(--ion-color-primary);
}

/* Подсказка о свайпе */
.swipe-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  margin-top: 4px;
  font-size: 11px;
  color: var(--ion-color-medium);
  opacity: 0.7;
  animation: bounce 2s infinite;
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-3px);
  }
  60% {
    transform: translateY(-2px);
  }
}
</style>
