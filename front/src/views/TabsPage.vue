<template>
  <ion-page>
    <ion-tabs>
      <ion-router-outlet></ion-router-outlet>
      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="home" href="/tabs/home">
          <ion-icon aria-hidden="true" :icon="home" />
          <ion-label>Главная</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="calendar" href="/tabs/calendar">
          <ion-icon aria-hidden="true" :icon="calendar" />
          <ion-label>Календарь</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="events" href="/tabs/events">
          <ion-icon aria-hidden="true" :icon="list" />
          <ion-label>События</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="settings" href="/tabs/settings">
          <ion-icon aria-hidden="true" :icon="settings" />
          <ion-label>Настройки</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  </ion-page>
</template>

<script setup lang="ts">
import { IonTabBar, IonTabButton, IonTabs, IonLabel, IonIcon, IonPage, IonRouterOutlet } from '@ionic/vue';
import { home, calendar, list, settings } from 'ionicons/icons';
</script>
