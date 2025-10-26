<script setup lang="ts">
import { ref, computed, onMounted, onActivated, onDeactivated, watch } from "vue";
import { useRoute } from "vue-router";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonCard,
  IonCardContent,
  IonModal,
  IonIcon,
  IonSelect,
  IonSelectOption,
  IonSearchbar,
  IonFab,
  IonFabButton,
  IonFabList,
  IonActionSheet,
  IonAlert,
  IonRefresher,
  IonRefresherContent,
  IonBadge,
  IonNote,
} from "@ionic/vue";
import {
  add,
  star,
  starOutline,
  call,
  mail,
  create,
  trash,
  person,
  search,
  refresh,
  checkmark,
  close,
  peopleOutline,
} from "ionicons/icons";
import contactsStore from "@/store/contacts";
import eventsStore from "@/store/events";
import type { Contact } from "@/store/contacts";
import type { MemorialEvent } from "@/store/events";
import ContactCard from "@/components/ContactCard.vue";
import ContactForm from "@/components/ContactForm.vue";
import AddEventModal from "@/components/AddEventModal.vue";
import { Contacts } from "@capacitor-community/contacts";

// Типизация для Capacitor
declare global {
  interface Window {
    Capacitor?: any;
  }
}

// Используем контакты из store
const contacts = contactsStore.contacts;

// Получаем текущий роут для отслеживания переходов
const route = useRoute();

// Инициализируем тестовые данные, если store пустой
contactsStore.ensureSampleData();

// Состояние компонента
const searchQuery = ref("");
const selectedCategory = ref<string>("all");
const isAddModalOpen = ref(false);
const isEditModalOpen = ref(false);
const editingContact = ref<Contact | null>(null);
const isActionSheetOpen = ref(false);
const selectedContact = ref<Contact | null>(null);
const isDeleteAlertOpen = ref(false);
const contactToDelete = ref<string | null>(null);

// Состояние для Bottom Sheet
const isSearchBottomSheetOpen = ref(false);

// Состояние для модального окна редактирования события
const isEditEventModalOpen = ref(false);
const editingEvent = ref<MemorialEvent | null>(null);

// Состояние для отслеживания новых контактов
const newContactIds = ref<Set<string>>(new Set());

// Состояние для жестов
const touchStartY = ref(0);
const touchStartTime = ref(0);
const isDragging = ref(false);

// Состояние для FAB
const isContactPickerSupported = ref(false);

// Удаляем старую форму, теперь используется компонент ContactForm

// Категории контактов
const categories = [
  { value: "all", label: "Все" },
  { value: "Семья", label: "Семья" },
  { value: "Друзья", label: "Друзья" },
  { value: "Коллеги", label: "Коллеги" },
  { value: "Другое", label: "Другое" },
];

// Отфильтрованные контакты
const filteredContacts = computed(() => {
  let result = contacts.value;

  // Фильтр по категории
  if (selectedCategory.value !== "all") {
    result = result.filter((c) => c.category === selectedCategory.value);
  }

  // Поиск
  if (searchQuery.value.trim()) {
    result = contactsStore.searchContacts(searchQuery.value);
    if (selectedCategory.value !== "all") {
      result = result.filter((c) => c.category === selectedCategory.value);
    }
  }

  // Сортируем: сначала новые, потом избранные, потом по имени
  return result.sort((a, b) => {
    const aIsNew = newContactIds.value.has(a.id);
    const bIsNew = newContactIds.value.has(b.id);

    // Новые контакты всегда сверху
    if (aIsNew && !bIsNew) return -1;
    if (!aIsNew && bIsNew) return 1;

    // Если оба новые или оба не новые, сортируем по избранности
    if (a.isFavorite && !b.isFavorite) return -1;
    if (!a.isFavorite && b.isFavorite) return 1;

    // Затем по имени
    return a.name.localeCompare(b.name);
  });
});

// Проверяем, есть ли активные фильтры
const hasActiveFilters = computed(() => {
  return searchQuery.value.trim() !== "" || selectedCategory.value !== "all";
});

// Подсчитываем количество активных фильтров
const getActiveFiltersCount = computed(() => {
  let count = 0;
  if (searchQuery.value.trim() !== "") count++;
  if (selectedCategory.value !== "all") count++;
  return count;
});

// Статистика
const stats = computed(() => {
  const total = contacts.value.length;
  const favorites = contacts.value.filter((c) => c.isFavorite).length;
  const byCategory = categories.slice(1).map((cat) => ({
    name: cat.label,
    count: contacts.value.filter((c) => c.category === cat.value).length,
  }));

  return { total, favorites, byCategory };
});

// Методы
function openAddModal() {
  editingContact.value = null;
  isAddModalOpen.value = true;
}

function openEditModal(contact: Contact) {
  editingContact.value = contact;
  isEditModalOpen.value = true;
}

function closeModals() {
  isAddModalOpen.value = false;
  isEditModalOpen.value = false;
  editingContact.value = null;
}

function saveContact(
  contactData: Omit<Contact, "id" | "createdAt" | "updatedAt">,
) {
  if (editingContact.value) {
    // Редактирование
    const updated: Contact = {
      ...editingContact.value,
      ...contactData,
    };
    contactsStore.updateContact(updated);
  } else {
    // Добавление нового контакта
    const newContact = contactsStore.addContact(contactData);
    if (newContact) {
      // Добавляем ID нового контакта в список для подсветки
      newContactIds.value.add(newContact.id);
    }
  }

  closeModals();
}

function toggleFavorite(contact: Contact) {
  contactsStore.toggleFavorite(contact.id);
}

function openContactMenu(contact: Contact) {
  selectedContact.value = contact;
  isActionSheetOpen.value = true;
}

function callContact(contact: Contact) {
  if (contact.phone) {
    window.open(`tel:${contact.phone}`, "_self");
  }
}

function emailContact(contact: Contact) {
  if (contact.email) {
    window.open(`mailto:${contact.email}`, "_self");
  }
}

function confirmDelete(contactId: string) {
  contactToDelete.value = contactId;
  isDeleteAlertOpen.value = true;
}

function deleteContact() {
  if (contactToDelete.value) {
    contactsStore.deleteContact(contactToDelete.value);
    contactToDelete.value = null;
  }
  isDeleteAlertOpen.value = false;
}

// Эти функции теперь в компоненте ContactCard

function handleRefresh(event: CustomEvent) {
  setTimeout(() => {
    event.detail.complete();
  }, 1000);
}

// Методы для Bottom Sheet поиска
function openSearchBottomSheet() {
  isSearchBottomSheetOpen.value = true;
}

function closeSearchBottomSheet() {
  isSearchBottomSheetOpen.value = false;
}

function onSearchInput(event: any) {
  searchQuery.value = event.detail.value;
}

function clearFilters() {
  searchQuery.value = "";
  selectedCategory.value = "all";
}

function applyFilters() {
  // Фильтры уже применяются автоматически через computed свойства
  closeSearchBottomSheet();
}

// Обработчики жестов для ручки Bottom Sheet
function handleTouchStart(event: TouchEvent) {
  if (isSearchBottomSheetOpen.value) return;

  touchStartY.value = event.touches[0].clientY;
  touchStartTime.value = Date.now();
  isDragging.value = false;
}

function handleTouchMove(event: TouchEvent) {
  if (isSearchBottomSheetOpen.value) return;

  const currentY = event.touches[0].clientY;
  const deltaY = touchStartY.value - currentY;
  const deltaTime = Date.now() - touchStartTime.value;

  // Если свайп вверх больше 30px и быстрее 300ms
  if (deltaY > 30 && deltaTime < 300) {
    isDragging.value = true;
    openSearchBottomSheet();
  }
}

function handleTouchEnd() {
  isDragging.value = false;
}

// Просмотр события дня рождения
function viewEvent(event: any) {
  editingEvent.value = event;
  isEditEventModalOpen.value = true;
}

// Проверка поддержки импорта контактов
async function checkContactPickerSupport() {
  try {
    // Проверяем Capacitor Contacts (для мобильных приложений)
    if (Contacts?.checkPermissions) {
      try {
        const permissions = await Contacts.checkPermissions();
        if (permissions.contacts === "granted") {
          isContactPickerSupported.value = true;
          return;
        }
      } catch (err) {
        // Capacitor Contacts не поддерживается
      }
    }

    // Проверяем поддержку Contact Picker API (для PWA)
    if ("contacts" in navigator && "ContactsManager" in window) {
      const contactsManager = (navigator as any).contacts;
      if (contactsManager && typeof contactsManager.select === 'function') {
        isContactPickerSupported.value = true;
      }
    } else {
      // Проверяем альтернативные способы
      if (navigator.share && typeof navigator.share === "function") {
        // Web Share API поддерживается
      }
    }
  } catch (error) {
    // Ошибка при проверке поддержки контактов
  }
}

// Импорт контактов
async function importContacts() {
  try {
    // Метод 1: Capacitor Contacts (только для нативных приложений)
    if (Contacts && window.Capacitor) {
      try {
        const permissions = await Contacts.requestPermissions();
        
        if (permissions.contacts === 'granted') {
          const result = await Contacts.getContacts({
            projection: {
              name: true,
              phones: true,
              emails: true,
            },
          });

          if (result.contacts && result.contacts.length > 0) {
            const processedContacts = result.contacts.map((contact: any) => ({
              name: contact.name?.display || contact.name?.given || "Без имени",
              phone: contact.phones?.[0]?.number || "",
              email: contact.emails?.[0]?.address || "",
              category: "Импортированные",
              isFavorite: false,
            }));

            // Добавляем контакты в store
            processedContacts.forEach((contactData) => {
              const newContact = contactsStore.addContact(contactData);
              if (newContact) {
                // Добавляем ID нового контакта в список для подсветки
                newContactIds.value.add(newContact.id);
              }
            });

            alert(`Импортировано ${processedContacts.length} контактов`);
            return;
          } else {
            alert("Контакты не найдены");
            return;
          }
        } else {
          alert('Необходимо разрешение на доступ к контактам. Проверьте настройки приложения.');
          return;
        }
      } catch (capacitorError) {
        // Capacitor Contacts недоступен
      }
    }

    // Метод 2: Contact Picker API
    if ("contacts" in navigator && "ContactsManager" in window && isContactPickerSupported.value) {
      try {
        const contactsManager = (navigator as any).contacts;
        
        if (!contactsManager || typeof contactsManager.select !== 'function') {
          throw new Error('Contact Picker API не функционален');
        }
        
        const contacts = await contactsManager.select(["name", "tel", "email"], { multiple: true });

        if (contacts && contacts.length > 0) {
          const processedContacts = contacts.map((contact: any) => ({
            name: contact.name?.[0] || "Без имени",
            phone: contact.tel?.[0] || "",
            email: contact.email?.[0] || "",
            category: "Импортированные",
            isFavorite: false,
          }));

          processedContacts.forEach(
            (contactData: Omit<Contact, "id" | "createdAt" | "updatedAt">) => {
              const newContact = contactsStore.addContact(contactData);
              if (newContact) {
                // Добавляем ID нового контакта в список для подсветки
                newContactIds.value.add(newContact.id);
              }
            },
          );

          alert(`Импортировано ${processedContacts.length} контактов`);
          return;
        }
      } catch (pickerError: any) {
        if (pickerError.message && pickerError.message.includes('Not implemented on web')) {
          // Contact Picker API не реализован в веб-версии браузера
        }
        alert('Contact Picker API недоступен в вашем браузере. Используйте ручное добавление контактов.');
        return;
      }
    }

    // Если ничего не сработало
    alert('Импорт контактов недоступен в вашем браузере. Используйте ручное добавление контактов.');
    
  } catch (error) {
    console.error("Ошибка при импорте контактов:", error);
    alert("Ошибка при импорте контактов");
  }
}

// Обработчики для модального окна редактирования события
function closeEditEventModal() {
  isEditEventModalOpen.value = false;
  editingEvent.value = null;
}

function saveEvent(eventData: Omit<MemorialEvent, "id">) {
  if (editingEvent.value) {
    // Редактирование существующего события
    const updated: MemorialEvent = {
      ...editingEvent.value,
      ...eventData,
    };
    eventsStore.updateEvent(updated);
  } else {
    // Добавление нового события
    eventsStore.addEvent(eventData);
  }
  closeEditEventModal();
}

// Функция для очистки меток "новый" при открытии раздела
function clearNewContactFlags() {
  newContactIds.value.clear();
}

onMounted(() => {
  checkContactPickerSupport();
  // Очищаем метки "новый" при открытии раздела
  clearNewContactFlags();
});

// Очищаем метки "новый" при активации вкладки (возвращении на неё)
onActivated(() => {
  clearNewContactFlags();
});

// Очищаем метки "новый" при деактивации вкладки (переходе на другую вкладку)
onDeactivated(() => {
  clearNewContactFlags();
});

// Отслеживаем изменения роута для сброса меток при переходе на другие вкладки
watch(() => route.path, (newPath, oldPath) => {
  // Если покидаем вкладку контактов (любой путь содержащий tab4)
  if (oldPath && oldPath.includes('tab4') && !newPath.includes('tab4')) {
    clearNewContactFlags();
  }
}, { immediate: false });
</script>

<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Контакты</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="stats-container">
        <ion-card>
          <ion-card-content>
            <div class="stats-grid">
              <div class="stat-item">
                <div class="stat-number">{{ stats.total }}</div>
                <div class="stat-label">Всего</div>
              </div>
              <div class="stat-item">
                <div class="stat-number">{{ stats.favorites }}</div>
                <div class="stat-label">Избранные</div>
              </div>
              <div
                class="stat-item"
                v-for="cat in stats.byCategory"
                :key="cat.name"
              >
                <div class="stat-number">{{ cat.count }}</div>
                <div class="stat-label">{{ cat.name }}</div>
              </div>
            </div>
          </ion-card-content>
        </ion-card>
      </div>

      <!-- Постоянно видимая ручка Bottom Sheet -->
      <div
        class="bottom-sheet-handle"
        @click="openSearchBottomSheet"
        @touchstart="handleTouchStart"
        @touchmove="handleTouchMove"
        @touchend="handleTouchEnd"
        :class="{
          'modal-open': isSearchBottomSheetOpen,
          dragging: isDragging,
        }"
      >
        <div class="handle-bar"></div>
        <div class="handle-content">
          <ion-icon :icon="search" size="small"></ion-icon>
          <span>Поиск и фильтры</span>
          <ion-badge v-if="hasActiveFilters" color="primary">{{
            getActiveFiltersCount
          }}</ion-badge>
        </div>
      </div>

      <!-- Список контактов -->
      <ion-refresher slot="fixed" @ionRefresh="handleRefresh">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <div v-if="filteredContacts.length === 0" class="empty-state">
        <ion-icon :icon="person" size="large"></ion-icon>
        <h3>Контакты не найдены</h3>
        <p v-if="searchQuery">Попробуйте изменить поисковый запрос</p>
        <p v-else>Добавьте первый контакт</p>
      </div>

      <div v-else class="contacts-list">
        <ContactCard
          v-for="contact in filteredContacts"
          :key="contact.id"
          :contact="contact"
          :show-actions="true"
          :is-new="newContactIds.has(contact.id)"
          @menu="openContactMenu"
          @call="callContact"
          @email="emailContact"
          @edit="openEditModal"
          @view-event="viewEvent"
        />
      </div>

      <!-- FAB для добавления контакта -->
      <ion-fab vertical="bottom" horizontal="end" slot="fixed">
        <ion-fab-button>
          <ion-icon :icon="add"></ion-icon>
        </ion-fab-button>

        <ion-fab-list side="top">
          <ion-fab-button @click="openAddModal" title="Добавить контакт">
            <ion-icon :icon="person"></ion-icon>
          </ion-fab-button>
          <ion-fab-button
            @click="importContacts"
            :disabled="!isContactPickerSupported"
            :class="{ 'fab-disabled': !isContactPickerSupported }"
            title="Импортировать контакты"
          >
            <ion-icon :icon="peopleOutline"></ion-icon>
          </ion-fab-button>
        </ion-fab-list>
      </ion-fab>

      <!-- Bottom Sheet с поиском и фильтрами -->
      <ion-modal
        :is-open="isSearchBottomSheetOpen"
        :initial-breakpoint="0.4"
        :breakpoints="[0, 0.4, 0.8, 1]"
        @did-dismiss="closeSearchBottomSheet"
      >
        <ion-content>
          <!-- Ручка внутри модального окна -->
          <div class="bottom-sheet-handle-modal">
            <div class="handle-bar"></div>
            <div class="handle-content">
              <ion-icon :icon="search" size="small"></ion-icon>
              <span>Поиск и фильтры</span>
              <ion-badge v-if="hasActiveFilters" color="primary">{{
                getActiveFiltersCount
              }}</ion-badge>
            </div>
          </div>

          <div class="bottom-sheet-content">
            <div class="search-section">
              <ion-searchbar
                v-model="searchQuery"
                placeholder="Поиск контактов"
                @ion-input="onSearchInput"
              />
              <div class="search-results-info">
                <ion-note>
                  Отфильтровано: {{ filteredContacts.length }} из
                  {{ contacts.length }} контактов
                </ion-note>
              </div>
            </div>

            <div class="filters-section">
              <ion-item>
                <ion-label>Категория</ion-label>
                <ion-select
                  v-model="selectedCategory"
                  placeholder="Все категории"
                  interface="popover"
                >
                  <ion-select-option value="all">Все</ion-select-option>
                  <ion-select-option
                    v-for="c in categories.slice(1)"
                    :key="c.value"
                    :value="c.value"
                    >{{ c.label }}</ion-select-option
                  >
                </ion-select>
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

      <!-- Модальное окно добавления/редактирования контакта -->
      <ion-modal
        :is-open="isAddModalOpen || isEditModalOpen"
        @did-dismiss="closeModals"
      >
        <ion-header>
          <ion-toolbar>
            <ion-title>{{
              editingContact ? "Редактировать контакт" : "Новый контакт"
            }}</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="closeModals"
                ><ion-icon :icon="close"></ion-icon
              ></ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content class="ion-padding">
          <ContactForm
            :contact="editingContact"
            :is-open="isAddModalOpen || isEditModalOpen"
            @save="saveContact"
            @cancel="closeModals"
          />
        </ion-content>
      </ion-modal>

      <!-- Action Sheet для действий с контактом -->
      <ion-action-sheet
        :is-open="isActionSheetOpen"
        :header="selectedContact?.name"
        :buttons="[
          {
            text: 'Позвонить',
            icon: call,
            handler: () => callContact(selectedContact!),
            disabled: !selectedContact?.phone,
          },
          {
            text: 'Написать',
            icon: mail,
            handler: () => emailContact(selectedContact!),
            disabled: !selectedContact?.email,
          },
          {
            text: selectedContact?.isFavorite
              ? 'Убрать из избранного'
              : 'Добавить в избранное',
            icon: selectedContact?.isFavorite ? starOutline : star,
            handler: () => toggleFavorite(selectedContact!),
          },
          {
            text: 'Редактировать',
            icon: create,
            handler: () => {
              openEditModal(selectedContact!);
              isActionSheetOpen = false;
            },
          },
          {
            text: 'Удалить',
            icon: trash,
            role: 'destructive',
            handler: () => {
              confirmDelete(selectedContact!.id);
              isActionSheetOpen = false;
            },
          },
          {
            text: 'Отмена',
            role: 'cancel',
          },
        ]"
        @did-dismiss="isActionSheetOpen = false"
      ></ion-action-sheet>

      <!-- Alert для подтверждения удаления -->
      <ion-alert
        :is-open="isDeleteAlertOpen"
        header="Удалить контакт"
        message="Вы уверены, что хотите удалить этот контакт? Это действие нельзя отменить."
        :buttons="[
          {
            text: 'Отмена',
            role: 'cancel',
          },
          {
            text: 'Удалить',
            role: 'destructive',
            handler: deleteContact,
          },
        ]"
        @did-dismiss="isDeleteAlertOpen = false"
      ></ion-alert>

      <!-- Модальное окно редактирования события -->
      <AddEventModal
        :is-open="isEditEventModalOpen"
        :editing-event="editingEvent"
        @close="closeEditEventModal"
        @save="saveEvent"
      />
    </ion-content>
  </ion-page>
</template>

<style scoped>
.stats-container {
  margin-bottom: 16px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
  gap: 16px;
  text-align: center;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-number {
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--ion-color-primary);
}

.stat-label {
  font-size: 0.8rem;
  color: var(--ion-color-medium);
  margin-top: 4px;
}

.search-container {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  align-items: center;
}

.search-container ion-searchbar {
  flex: 1;
}

.search-container ion-select {
  min-width: 120px;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: var(--ion-color-medium);
}

.empty-state ion-icon {
  margin-bottom: 16px;
  font-size: 48px;
}

.contacts-list {
  padding-bottom: 80px; /* Отступ для FAB */
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

.search-results-info {
  margin-top: -8px;
  text-align: center;
}

.search-results-info ion-note {
  font-size: 12px;
  color: var(--ion-color-medium);
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

/* Стили для FAB кнопок */
.fab-disabled {
  opacity: 0.5 !important;
}

.fab-disabled ion-icon {
  opacity: 0.5 !important;
}
</style>
