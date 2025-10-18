<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>События</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Все события</ion-title>
        </ion-toolbar>
      </ion-header>

      <!-- PWA Install Prompt -->
      <!-- <PWAInstallPrompt /> -->
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/vue';
// import ExploreContainer from '@/components/ExploreContainer.vue';
// import PWAInstallPrompt from '@/components/PWAInstallPrompt.vue';
</script>
