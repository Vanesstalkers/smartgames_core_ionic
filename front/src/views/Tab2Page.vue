<script setup lang="ts">
import { ref, computed } from "vue";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonCard,
  IonCardContent,
  IonModal,
  IonIcon,
} from "@ionic/vue";
import {
  close,
  calendarOutline,
  createOutline,
  trashOutline,
  chevronBack,
  chevronForward,
  add,
} from "ionicons/icons";
import { pickerController } from "@ionic/vue";
import eventsStore from "@/store/events";
import type { MemorialEvent } from "@/store/events";
import AddEventModal from "@/components/AddEventModal.vue";

// Используем события из store
const events = eventsStore.events;

// Инициализируем тестовые данные, если store пустой
eventsStore.ensureSampleData();

// Отладочная информация
console.log("Все события в календаре:", events.value);
console.log("Количество событий:", events.value.length);

// calendar state: viewed month (текущий год)
const view = ref(new Date());
const selectedDate = ref<string | null>(null);
const isModalOpen = ref(false);

// Состояние для модального окна редактирования
const isEditModalOpen = ref(false);
const editingEvent = ref<MemorialEvent | null>(null);

// Состояние для модального окна добавления события
const isAddEventModalOpen = ref(false);
const newEventDate = ref<string | null>(null);

const weekdays = ["ПН", "ВТ", "СР", "Чт", "Пт", "Сб", "Вс"];

// Функции навигации по календарю
const prevMonth = () => {
  view.value = new Date(view.value.getFullYear(), view.value.getMonth() - 1, 1);
};
const nextMonth = () => {
  view.value = new Date(view.value.getFullYear(), view.value.getMonth() + 1, 1);
};

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

const monthYearLabel = computed(() => {
  const d = view.value;
  return d.toLocaleString("ru-RU", { month: "long", year: "numeric" });
});

// build calendar cells (6 weeks x 7 days)
const calendarCells = computed(() => {
  const first = startOfMonth(view.value);
  // find Monday of the first week
  const dayOfWeek = (first.getDay() + 6) % 7; // 0=Mon
  const start = new Date(first);
  start.setDate(first.getDate() - dayOfWeek);

  const cells = [] as any[];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    // Исправляем проблему с часовым поясом - создаем дату в UTC
    const year = d.getFullYear();
    const month = d.getMonth();
    const day = d.getDate();
    const utcDate = new Date(Date.UTC(year, month, day));
    const iso = utcDate.toISOString().slice(0, 10);
    
    
    const cellEvents = events.value.filter((ev) => ev.date === iso);
    const dayOfWeek = d.getDay();


    cells.push({
      key: iso,
      date: utcDate,
      day: utcDate.getUTCDate(),
      iso,
      currentMonth: utcDate.getUTCMonth() === view.value.getMonth(),
      isToday: iso === new Date().toISOString().slice(0, 10),
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6, // Воскресенье или суббота
      events: cellEvents,
    });
  }
  return cells;
});

const selectedEvents = computed(() => {
  if (!selectedDate.value) return [];
  return events.value.filter((ev) => ev.date === selectedDate.value);
});

const selectedLabel = computed(() => {
  if (!selectedDate.value) return '';
  
  // Создаем дату с учетом часового пояса, добавляя время полудня UTC
  const date = new Date(selectedDate.value + 'T12:00:00.000Z');
  return date.toLocaleDateString('ru-RU');
});

// Колонки для picker года
const yearPickerColumns = computed(() => {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 16 }, (_, i) => ({
    text: (currentYear - 5 + i).toString(),
    value: currentYear - 5 + i,
  }));

  return [
    {
      name: "year",
      options: years,
      selectedIndex: 5, // Текущий год находится в середине массива (индекс 5)
    },
  ];
});

// Кнопки для picker года
const yearPickerButtons = [
  {
    text: "Отмена",
    role: "cancel",
  },
  {
    text: "Выбрать",
    role: "confirm",
  },
];

function selectCell(cell: any) {
  selectedDate.value = cell.iso;
  isModalOpen.value = true;
}

function closeModal() {
  isModalOpen.value = false;
  selectedDate.value = null;
}

function editEvent(id: string) {
  const event = events.value.find((e) => e.id === id);
  if (event) {
    editingEvent.value = event;
    isEditModalOpen.value = true;
  }
}

function deleteEvent(id: string) {
  if (confirm("Вы уверены, что хотите удалить это событие?")) {
    eventsStore.deleteEvent(id);
  }
}

function closeEditModal() {
  isEditModalOpen.value = false;
  editingEvent.value = null;
}

function saveEvent(eventData: Omit<MemorialEvent, "id">) {
  if (editingEvent.value) {
    // Редактирование существующего события
    const updatedEvent: MemorialEvent = {
      ...eventData,
      id: editingEvent.value.id,
    };
    eventsStore.updateEvent(updatedEvent);
  } else {
    // Добавление нового события
    eventsStore.addEvent(eventData);
  }
  closeEditModal();
}

// Методы для работы с модальным окном добавления события
function openAddEventModal() {
  newEventDate.value = selectedDate.value;
  isAddEventModalOpen.value = true;
}

function closeAddEventModal() {
  isAddEventModalOpen.value = false;
  newEventDate.value = null;
}

function saveNewEvent(eventData: Omit<MemorialEvent, "id">) {
  // Устанавливаем дату из выбранной даты в календаре
  const eventWithDate = {
    ...eventData,
    date: newEventDate.value || eventData.date
  };
  
  eventsStore.addEvent(eventWithDate);
  closeAddEventModal();
}

// Методы для работы с picker года
const openYearPicker = async () => {
  try {
    const picker = await pickerController.create({
      columns: yearPickerColumns.value,
      buttons: yearPickerButtons,
      backdropDismiss: true,
    });

    await picker.present();

    picker.onDidDismiss().then((result) => {
      if (result.role === "confirm" && result.data) {
        const { year } = result.data;

        // Извлекаем value из объекта
        const yearValue = year.value || year;

        // Обновляем view с новым годом, сохраняя текущий месяц
        view.value = new Date(yearValue, view.value.getMonth(), 1);
      }
    });
  } catch (error) {
    console.error("Ошибка при создании year picker:", error);
  }
};
</script>

<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Календарь</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding calendar-content">
      <div class="calendar-container">
        <div class="month-header">
          <h2>{{ monthYearLabel }}</h2>
        </div>

        <div class="calendar-grid">
          <div class="calendar-weekday" v-for="wd in weekdays" :key="wd">
            {{ wd }}
          </div>
          <div
            v-for="cell in calendarCells"
            :key="cell.key"
            class="calendar-cell"
            :class="{
              'other-month': !cell.currentMonth,
              today: cell.isToday,
              selected: cell.iso === selectedDate,
              weekend: cell.isWeekend,
            }"
            @click="selectCell(cell)"
          >
            <div class="cell-date">{{ cell.day }}</div>
            <div class="cell-dots">
              <span
                v-for="(event, index) in cell.events.slice(0, 3)"
                :key="index"
                class="dot"
                :style="{ backgroundColor: event.color }"
                :title="event.title"
              >
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Навигация по месяцам в нижней части -->
      <div class="month-navigation-fixed">
        <ion-button fill="clear" @click="prevMonth">
          <ion-icon :icon="chevronBack"></ion-icon>
        </ion-button>

        <ion-button fill="clear" @click="openYearPicker">
          <ion-icon :icon="calendarOutline" slot="start"></ion-icon>
          {{ view.getFullYear() }}
        </ion-button>

        <ion-button fill="clear" @click="nextMonth">
          <ion-icon :icon="chevronForward"></ion-icon>
        </ion-button>
      </div>

      <!-- Модальное окно с событиями выбранной даты -->
      <ion-modal :is-open="isModalOpen" @did-dismiss="closeModal">
        <ion-header>
          <ion-toolbar>
            <ion-title>События за {{ selectedLabel }}</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="closeModal">
                <ion-icon :icon="close"></ion-icon>
              </ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content class="ion-padding">
          <div v-if="selectedEvents.length === 0" class="empty-state">
            <ion-icon :icon="calendarOutline" size="large"></ion-icon>
            <p>На эту дату нет событий</p>
          </div>
          <div v-else>
            <ion-card
              v-for="event in selectedEvents"
              :key="event.id"
              class="event-card"
            >
              <ion-card-content>
                <div class="event-header">
                  <h3>{{ event.title }}</h3>
                  <span class="event-category">{{ event.category }}</span>
                </div>
                <p v-if="event.description" class="event-description">
                  {{ event.description }}
                </p>
                <div class="event-actions">
                  <ion-button
                    fill="outline"
                    size="small"
                    @click="editEvent(event.id)"
                  >
                    <ion-icon :icon="createOutline" slot="start"></ion-icon>
                    Редактировать
                  </ion-button>
                  <ion-button
                    fill="outline"
                    size="small"
                    color="danger"
                    @click="deleteEvent(event.id)"
                  >
                    <ion-icon :icon="trashOutline" slot="start"></ion-icon>
                    Удалить
                  </ion-button>
                </div>
              </ion-card-content>
            </ion-card>
          </div>

          <!-- FAB для добавления события -->
          <ion-fab vertical="bottom" horizontal="center" slot="fixed">
            <ion-fab-button class="add-event-fab" @click="openAddEventModal">
              <ion-icon :icon="add" slot="start"></ion-icon>
              Добавить событие
            </ion-fab-button>
          </ion-fab>
        </ion-content>
      </ion-modal>

      <!-- Убираем модальное окно - используем picker controller -->

      <!-- Модальное окно добавления события -->
      <AddEventModal
        :is-open="isAddEventModalOpen"
        :editing-event="null"
        :preset-date="newEventDate"
        @close="closeAddEventModal"
        @save="saveNewEvent"
      />

      <!-- Модальное окно редактирования события -->
      <AddEventModal
        :is-open="isEditModalOpen"
        :editing-event="editingEvent"
        @close="closeEditModal"
        @save="saveEvent"
      />
    </ion-content>
  </ion-page>
</template>

<style scoped>
.month-header {
  text-align: center;
  margin-bottom: 16px;
  width: 100%;
  align-self: flex-end;
}

.month-header h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
}

.month-navigation-fixed {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0px 16px;
  background: var(--ion-color-light);
  border-top: 1px solid var(--ion-color-step-200);
  z-index: 1000;
}

.month-navigation-fixed ion-button {
  height: 48px;
  font-weight: 500;
}

.month-navigation-fixed ion-button:first-child,
.month-navigation-fixed ion-button:last-child {
  width: 48px;
  min-width: 48px;
}

.month-navigation-fixed ion-button:nth-child(2) {
  flex: 1;
  margin: 0 12px;
}

.calendar-content {
  padding-bottom: 100px; /* Отступ для фиксированных кнопок */
}

.calendar-container {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  height: calc(100% - 120px);
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
  width: 100%;
  align-self: flex-start;
}

.calendar-weekday {
  font-weight: 600;
  text-align: center;
  padding: 12px 8px;
  background: #f8f9fa;
  font-size: 0.85rem;
  color: #333;
  border-bottom: 1px solid #ddd;
}

.calendar-weekday:nth-child(6),
.calendar-weekday:nth-child(7) {
  color: #4caf50; /* Зеленый для выходных */
}

.calendar-cell {
  min-height: 60px;
  padding: 8px 4px;
  background: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  cursor: pointer;
  border-right: 1px solid #eee;
  border-bottom: 1px solid #eee;
  position: relative;
}

.calendar-cell:nth-child(7n) {
  border-right: none;
}

.calendar-cell:hover {
  background: #f8f9fa;
}

.calendar-cell.other-month {
  opacity: 0.3;
  background: #fafafa;
}

.calendar-cell.weekend .cell-date {
  color: #d32f2f; /* Красный для выходных */
}

.calendar-cell.today {
  background: #fff;
}

.calendar-cell.today .cell-date {
  background: #d32f2f;
  color: white;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.9rem;
}

.calendar-cell.selected {
  background: #fff3e0;
}

.cell-date {
  font-weight: 500;
  margin-bottom: 2px;
  font-size: 0.9rem;
  color: #333;
}

.cell-dots {
  display: flex;
  gap: 3px;
  justify-content: center;
  flex-wrap: wrap;
  margin-top: 2px;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

/* Модальное окно */
.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: var(--ion-color-medium);
}

.empty-state ion-icon {
  margin-bottom: 16px;
  font-size: 48px;
}

.event-card {
  margin-bottom: 12px;
}

.event-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.event-header h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
}

.event-category {
  background: var(--ion-color-light);
  color: var(--ion-color-dark);
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
}

.event-description {
  margin: 8px 0;
  color: var(--ion-color-step-600);
  font-size: 0.9rem;
  line-height: 1.4;
}

.event-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.event-actions ion-button {
  flex: 1;
}

/* Убираем стили для модального окна - используем picker controller */

/* Стили для FAB добавления события */
.add-event-fab {
  --background: var(--ion-color-primary);
  --background-activated: var(--ion-color-primary-shade);
  --background-hover: var(--ion-color-primary-tint);
  --color: white;
  --border-radius: 24px;
  --padding-start: 20px;
  --padding-end: 20px;
  height: 48px;
  font-weight: 500;
  font-size: 14px;
  width: 170px;
  min-width: auto;
  max-width: none;
}
</style>
