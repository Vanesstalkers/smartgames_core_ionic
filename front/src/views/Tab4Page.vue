<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
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
  IonActionSheet,
  IonAlert,
  IonRefresher,
  IonRefresherContent
} from "@ionic/vue";
import {
  add,
  star,
  starOutline,
  call,
  mail,
  create,
  trash,
  person
} from "ionicons/icons";
import contactsStore from "@/store/contacts";
import type { Contact } from "@/store/contacts";
import ContactCard from "@/components/ContactCard.vue";
import ContactForm from "@/components/ContactForm.vue";

// Используем контакты из store
const contacts = contactsStore.contacts;

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

// Удаляем старую форму, теперь используется компонент ContactForm

// Категории контактов
const categories = [
  { value: "all", label: "Все" },
  { value: "Семья", label: "Семья" },
  { value: "Друзья", label: "Друзья" },
  { value: "Коллеги", label: "Коллеги" },
  { value: "Другое", label: "Другое" }
];

// Отфильтрованные контакты
const filteredContacts = computed(() => {
  let result = contacts.value;

  // Фильтр по категории
  if (selectedCategory.value !== "all") {
    result = result.filter(c => c.category === selectedCategory.value);
  }

  // Поиск
  if (searchQuery.value.trim()) {
    result = contactsStore.searchContacts(searchQuery.value);
    if (selectedCategory.value !== "all") {
      result = result.filter(c => c.category === selectedCategory.value);
    }
  }

  // Сортируем: сначала избранные, потом по имени
  return result.sort((a, b) => {
    if (a.isFavorite && !b.isFavorite) return -1;
    if (!a.isFavorite && b.isFavorite) return 1;
    return a.name.localeCompare(b.name);
  });
});

// Статистика
const stats = computed(() => {
  const total = contacts.value.length;
  const favorites = contacts.value.filter(c => c.isFavorite).length;
  const byCategory = categories.slice(1).map(cat => ({
    name: cat.label,
    count: contacts.value.filter(c => c.category === cat.value).length
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

function saveContact(contactData: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>) {
  if (editingContact.value) {
    // Редактирование
    const updated: Contact = {
      ...editingContact.value,
      ...contactData
    };
    contactsStore.updateContact(updated);
  } else {
    // Добавление
    contactsStore.addContact(contactData);
  }

  closeModals();
}

function toggleFavorite(contact: Contact) {
  contactsStore.toggleFavorite(contact.id);
}

function callContact(contact: Contact) {
  if (contact.phone) {
    window.open(`tel:${contact.phone}`, '_self');
  }
}

function emailContact(contact: Contact) {
  if (contact.email) {
    window.open(`mailto:${contact.email}`, '_self');
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

onMounted(() => {
  console.log('Контакты загружены:', contacts.value.length);
});
</script>

<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Контакты</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <!-- Статистика -->
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
              <div class="stat-item" v-for="cat in stats.byCategory" :key="cat.name">
                <div class="stat-number">{{ cat.count }}</div>
                <div class="stat-label">{{ cat.name }}</div>
              </div>
            </div>
          </ion-card-content>
        </ion-card>
      </div>

      <!-- Поиск и фильтры -->
      <div class="search-container">
        <ion-searchbar
          v-model="searchQuery"
          placeholder="Поиск контактов..."
          :debounce="300"
        ></ion-searchbar>
        
        <ion-select
          v-model="selectedCategory"
          placeholder="Категория"
          interface="popover"
        >
          <ion-select-option
            v-for="category in categories"
            :key="category.value"
            :value="category.value"
          >
            {{ category.label }}
          </ion-select-option>
        </ion-select>
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
          @toggle-favorite="toggleFavorite"
          @call="callContact"
          @email="emailContact"
          @edit="openEditModal"
        />
      </div>

      <!-- FAB для добавления контакта -->
      <ion-fab vertical="bottom" horizontal="end" slot="fixed">
        <ion-fab-button @click="openAddModal">
          <ion-icon :icon="add"></ion-icon>
        </ion-fab-button>
      </ion-fab>

      <!-- Модальное окно добавления/редактирования контакта -->
      <ion-modal :is-open="isAddModalOpen || isEditModalOpen" @did-dismiss="closeModals">
        <ion-header>
          <ion-toolbar>
            <ion-title>{{ editingContact ? 'Редактировать контакт' : 'Новый контакт' }}</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="closeModals">Закрыть</ion-button>
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
            disabled: !selectedContact?.phone
          },
          {
            text: 'Написать',
            icon: mail,
            handler: () => emailContact(selectedContact!),
            disabled: !selectedContact?.email
          },
          {
            text: editingContact?.isFavorite ? 'Убрать из избранного' : 'Добавить в избранное',
            icon: editingContact?.isFavorite ? starOutline : star,
            handler: () => toggleFavorite(selectedContact!)
          },
          {
            text: 'Редактировать',
            icon: create,
            handler: () => {
              openEditModal(selectedContact!);
              isActionSheetOpen = false;
            }
          },
          {
            text: 'Удалить',
            icon: trash,
            role: 'destructive',
            handler: () => {
              confirmDelete(selectedContact!.id);
              isActionSheetOpen = false;
            }
          },
          {
            text: 'Отмена',
            role: 'cancel'
          }
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
            role: 'cancel'
          },
          {
            text: 'Удалить',
            role: 'destructive',
            handler: deleteContact
          }
        ]"
        @did-dismiss="isDeleteAlertOpen = false"
      ></ion-alert>
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
</style>
