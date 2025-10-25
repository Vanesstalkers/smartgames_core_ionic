<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Все события</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="openAddEventModal">
            <ion-icon :icon="add"></ion-icon>
          </ion-button>
        </ion-buttons>
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

      <AddEventModal
        :is-open="isAddEventModalOpen"
        :editing-event="editingEvent"
        @close="closeAddEventModal"
        @save="saveEvent"
      />
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton, IonIcon, IonList, IonItem, IonLabel } from '@ionic/vue';
import { add } from 'ionicons/icons';
import EventCard from '../components/EventCard.vue';
import AddEventModal from '../components/AddEventModal.vue';
import eventsStore from '../store/events';

const events = eventsStore.events;
const isAddEventModalOpen = ref(false);
const editingEvent = ref(null as any);

const openAddEventModal = () => {
  editingEvent.value = null;
  isAddEventModalOpen.value = true;
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
