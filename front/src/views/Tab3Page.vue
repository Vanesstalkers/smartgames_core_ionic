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
          v-for="ev in events"
          :key="ev.id"
          :event="ev"
          @edit="handleEdit"
          @delete="handleDelete"
        />
        <ion-item v-if="events.length === 0">
          <ion-label>Нет событий. Добавьте новое.</ion-label>
        </ion-item>
      </ion-list>

      <!-- FAB группа с поиском и добавлением -->
      <ion-fab vertical="bottom" horizontal="end" slot="fixed">
        <ion-fab-button>
          <ion-icon :icon="menu"></ion-icon>
        </ion-fab-button>
        <ion-fab-list side="top">
          <ion-fab-button @click="openSearchModal">
            <ion-icon :icon="search"></ion-icon>
          </ion-fab-button>
          <ion-fab-button @click="openAddEventModal">
            <ion-icon :icon="add"></ion-icon>
          </ion-fab-button>
        </ion-fab-list>
      </ion-fab>

      <AddEventModal
        :is-open="isAddEventModalOpen"
        :editing-event="editingEvent"
        @close="closeAddEventModal"
        @save="saveEvent"
      />

      <!-- Модальное окно поиска -->
      <ion-modal :is-open="isSearchModalOpen" @did-dismiss="closeSearchModal">
        <ion-header>
          <ion-toolbar>
            <ion-title>Поиск событий</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="closeSearchModal">Закрыть</ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content class="ion-padding">
          <ion-searchbar placeholder="Поиск по названию, описанию..." show-clear-button="focus"></ion-searchbar>
          <p>Функция поиска будет реализована в следующих версиях</p>
        </ion-content>
      </ion-modal>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonIcon, IonList, IonItem, IonLabel, IonFab, IonFabButton, IonFabList, IonModal, IonButtons, IonButton, IonSearchbar } from '@ionic/vue';
import { add, search, menu } from 'ionicons/icons';
import EventCard from '../components/EventCard.vue';
import AddEventModal from '../components/AddEventModal.vue';
import eventsStore from '../store/events';

const events = eventsStore.events;
const isAddEventModalOpen = ref(false);
const isSearchModalOpen = ref(false);
const editingEvent = ref(null as any);

const openAddEventModal = () => {
  editingEvent.value = null;
  isAddEventModalOpen.value = true;
};

const openSearchModal = () => {
  isSearchModalOpen.value = true;
};

const closeSearchModal = () => {
  isSearchModalOpen.value = false;
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
</script>
