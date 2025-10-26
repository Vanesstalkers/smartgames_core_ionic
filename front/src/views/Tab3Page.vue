<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Все события</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <ion-list>
        <EventCard
          v-for="ev in filteredEvents"
          :key="ev.id"
          :event="ev"
          @edit="handleEdit"
          @delete="handleDelete"
        />
        <ion-item v-if="filteredEvents.length === 0 && events.length > 0">
          <ion-label>События не найдены. Попробуйте изменить фильтры.</ion-label>
        </ion-item>
        <ion-item v-if="events.length === 0">
          <ion-label>Нет событий. Добавьте новое.</ion-label>
        </ion-item>
      </ion-list>

      <!-- FAB для добавления события -->
      <ion-fab vertical="bottom" horizontal="end" slot="fixed">
        <ion-fab-button @click="openAddEventModal">
          <ion-icon :icon="add"></ion-icon>
        </ion-fab-button>
      </ion-fab>

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
          'modal-open': isSearchBottomSheetOpen,
          'dragging': isDragging
        }"
      >
        <div class="handle-bar"></div>
        <div class="handle-content">
          <ion-icon :icon="search" size="small"></ion-icon>
          <span>Поиск и фильтры</span>
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
          >
            <div class="handle-bar"></div>
            <div class="handle-content">
              <ion-icon :icon="search" size="small"></ion-icon>
              <span>Поиск и фильтры</span>
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
    </ion-content>
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
  IonIcon, 
  IonList, 
  IonItem, 
  IonLabel, 
  IonFab, 
  IonFabButton, 
  IonModal, 
  IonButton, 
  IonSearchbar,
  IonSelect,
  IonSelectOption,
  IonCheckbox,
  IonBadge
} from '@ionic/vue';
import { 
  add, 
  search, 
  heartOutline, 
  refresh, 
  checkmark 
} from 'ionicons/icons';
import EventCard from '../components/EventCard.vue';
import AddEventModal from '../components/AddEventModal.vue';
import eventsStore from '../store/events';

const events = eventsStore.events;
const isAddEventModalOpen = ref(false);
const isSearchBottomSheetOpen = ref(false);
const editingEvent = ref(null as any);

// Состояние для жестов
const touchStartY = ref(0);
const touchStartTime = ref(0);
const isDragging = ref(false);

// Filters
const searchQuery = ref('');
const selectedCategory = ref('');
const showImportantOnly = ref(false);

// Вычисляемые свойства для фильтрации
const filteredEvents = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  const cat = selectedCategory.value;
  const importantOnly = showImportantOnly.value;

  return events.value.filter(event => {
    if (importantOnly && !event.isImportant) return false;
    if (cat && event.category !== cat) return false;
    if (q) {
      const inTitle = event.title.toLowerCase().includes(q);
      const inCategory = event.category.toLowerCase().includes(q);
      const inDesc = (event.description || '').toLowerCase().includes(q);
      if (!(inTitle || inCategory || inDesc)) return false;
    }
    return true;
  });
});

// Derived categories from events
const categories = computed(() => {
  const set = new Set<string>();
  events.value.forEach(e => set.add(e.category));
  return Array.from(set).sort();
});

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

const openAddEventModal = () => {
  editingEvent.value = null;
  isAddEventModalOpen.value = true;
};

const openSearchBottomSheet = () => {
  isSearchBottomSheetOpen.value = true;
};

const closeSearchBottomSheet = () => {
  isSearchBottomSheetOpen.value = false;
};

const closeAddEventModal = () => {
  isAddEventModalOpen.value = false;
  editingEvent.value = null;
};

const saveEvent = (data: any) => {
  if (editingEvent.value) {
    eventsStore.updateEvent({ ...data, id: editingEvent.value.id });
  } else {
    eventsStore.addEvent(data);
  }
  closeAddEventModal();
};

const handleEdit = (id: string) => {
  const ev = events.value.find((e: any) => e.id === id);
  if (ev) {
    editingEvent.value = ev;
    isAddEventModalOpen.value = true;
  }
};

const handleDelete = (id: string) => {
  if (confirm('Вы уверены, что хотите удалить это событие?')) {
    eventsStore.deleteEvent(id);
  }
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

// Методы для работы с фильтрами
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

// Загрузка данных при монтировании
onMounted(() => {
  // Инициализируем тестовые данные, если localStorage пуст
  eventsStore.ensureSampleData();
});
</script>

<style scoped>
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
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
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

/* Bottom Sheet стили */
.bottom-sheet-content {
  padding: 16px;
  min-height: 200px;
  margin-top: 0;
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
</style>
