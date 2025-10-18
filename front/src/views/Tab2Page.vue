<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Календарь</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Календарь событий</ion-title>
        </ion-toolbar>
      </ion-header>

      <!-- Тест компонента EventCard -->
      <ion-card>
        <ion-card-header>
          <ion-card-title>Тест EventCard</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <EventCard 
            :event="testEvent1"
            @edit="handleEdit"
            @delete="handleDelete"
          />
          <EventCard 
            :event="testEvent2"
            @edit="handleEdit"
            @delete="handleDelete"
          />
          <EventCard 
            :event="testEvent3"
            @edit="handleEdit"
            @delete="handleDelete"
          />
        </ion-card-content>
      </ion-card>
      
      <!-- Capacitor Demo -->
      <!-- <CapacitorDemo /> -->
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent } from '@ionic/vue';
// import ExploreContainer from '@/components/ExploreContainer.vue';
// import CapacitorDemo from '@/components/CapacitorDemo.vue';
import EventCard from '@/components/EventCard.vue';

// Тестовые данные для EventCard
const testEvent1 = {
  id: '1',
  title: 'День рождения мамы',
  date: '2024-02-15',
  description: 'День рождения самого дорогого человека',
  category: 'Семья',
  isImportant: true,
  reminderDays: [7, 1],
  color: '#ff6b6b'
};

const testEvent2 = {
  id: '2',
  title: 'Годовщина свадьбы',
  date: '2024-03-20',
  description: '5 лет вместе',
  category: 'Семья',
  isImportant: true,
  reminderDays: [30, 7, 1],
  color: '#4ecdc4'
};

const testEvent3 = {
  id: '3',
  title: 'День памяти дедушки',
  date: '2024-01-30',
  description: 'Памятная дата',
  category: 'Память',
  isImportant: false,
  reminderDays: [1],
  color: '#95a5a6'
};

const handleEdit = (id: string) => {
  console.log('Редактировать событие:', id);
  alert(`Редактировать событие с ID: ${id}`);
};

const handleDelete = (id: string) => {
  console.log('Удалить событие:', id);
  alert(`Удалить событие с ID: ${id}`);
};
</script>
