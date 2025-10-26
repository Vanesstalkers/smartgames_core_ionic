<script setup lang="ts">
import { computed } from 'vue';
import {
  IonCard,
  IonCardContent,
  IonItem,
  IonLabel,
  IonAvatar,
  IonIcon,
  IonButton,
  IonChip
} from '@ionic/vue';
import {
  star,
  starOutline,
  call,
  mail,
} from 'ionicons/icons';
import type { Contact } from '@/store/contacts';

interface Props {
  contact: Contact;
  showActions?: boolean;
  compact?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showActions: true,
  compact: false
});

const emit = defineEmits<{
  toggleFavorite: [contact: Contact];
  call: [contact: Contact];
  email: [contact: Contact];
  edit: [contact: Contact];
  delete: [contact: Contact];
}>();

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function getCategoryIcon(category: string): string {
  switch (category) {
    case 'Семья': return 'people';
    case 'Друзья': return 'person';
    case 'Коллеги': return 'business';
    default: return 'person';
  }
}

function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    'Семья': 'primary',
    'Друзья': 'secondary',
    'Коллеги': 'tertiary',
    'Другое': 'medium'
  };
  return colors[category] || 'medium';
}

const hasContactInfo = computed(() => {
  return props.contact.phone || props.contact.email;
});
</script>

<template>
  <ion-card class="contact-card" :class="{ compact }">
    <ion-card-content>
      <ion-item lines="none">
        <ion-avatar slot="start">
          <div class="avatar-placeholder">
            {{ getInitials(contact.name) }}
          </div>
        </ion-avatar>

        <ion-label>
          <h2 class="contact-name">
            {{ contact.name }}
            <ion-icon
              v-if="contact.isFavorite"
              :icon="star"
              color="warning"
              class="favorite-icon"
            ></ion-icon>
          </h2>
          
          <p v-if="contact.phone" class="contact-phone">
            <ion-icon :icon="call" class="contact-icon"></ion-icon>
            {{ contact.phone }}
          </p>
          
          <p v-if="contact.email" class="contact-email">
            <ion-icon :icon="mail" class="contact-icon"></ion-icon>
            {{ contact.email }}
          </p>
          
          <p v-if="contact.notes && !compact" class="contact-notes">
            {{ contact.notes }}
          </p>
        </ion-label>

        <div slot="end" class="contact-meta">
          <ion-chip 
            v-if="contact.category" 
            :color="getCategoryColor(contact.category)"
            class="category-chip"
          >
            <ion-icon :icon="getCategoryIcon(contact.category)"></ion-icon>
            {{ contact.category }}
          </ion-chip>
        </div>
      </ion-item>

      <!-- Действия с контактом -->
      <div v-if="showActions && hasContactInfo" class="contact-actions">
        <ion-button
          v-if="contact.phone"
          fill="outline"
          size="small"
          @click="emit('call', contact)"
        >
          <ion-icon :icon="call" slot="start"></ion-icon>
          Позвонить
        </ion-button>
        
        <ion-button
          v-if="contact.email"
          fill="outline"
          size="small"
          @click="emit('email', contact)"
        >
          <ion-icon :icon="mail" slot="start"></ion-icon>
          Написать
        </ion-button>
        
        <ion-button
          fill="outline"
          size="small"
          @click="emit('toggleFavorite', contact)"
        >
          <ion-icon 
            :icon="contact.isFavorite ? star : starOutline" 
            slot="start"
            :color="contact.isFavorite ? 'warning' : 'medium'"
          ></ion-icon>
          {{ contact.isFavorite ? 'Из избранного' : 'В избранное' }}
        </ion-button>
      </div>
    </ion-card-content>
  </ion-card>
</template>

<style scoped>
.contact-card {
  margin-bottom: 12px;
}

.contact-card.compact {
  margin-bottom: 8px;
}

.contact-card.compact .contact-actions {
  display: none;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  background: var(--ion-color-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 0.9rem;
}

.contact-name {
  display: flex;
  align-items: center;
  margin: 0 0 4px 0;
  font-size: 1.1rem;
  font-weight: 600;
}

.favorite-icon {
  margin-left: 8px;
  font-size: 1rem;
}

.contact-phone,
.contact-email {
  display: flex;
  align-items: center;
  margin: 2px 0;
  font-size: 0.9rem;
  color: var(--ion-color-step-600);
}

.contact-icon {
  margin-right: 6px;
  font-size: 0.8rem;
  color: var(--ion-color-primary);
}

.contact-notes {
  margin: 8px 0 0 0;
  font-size: 0.85rem;
  color: var(--ion-color-medium);
  font-style: italic;
}

.contact-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.category-chip {
  --background: var(--ion-color-light);
  --color: var(--ion-color-dark);
  font-size: 0.75rem;
  height: 24px;
}

.contact-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  flex-wrap: wrap;
}

.contact-actions ion-button {
  flex: 1;
  min-width: 0;
}

/* Цвета для категорий */
ion-chip[color="primary"] {
  --background: var(--ion-color-primary);
  --color: white;
}

ion-chip[color="secondary"] {
  --background: var(--ion-color-secondary);
  --color: white;
}

ion-chip[color="tertiary"] {
  --background: var(--ion-color-tertiary);
  --color: white;
}

ion-chip[color="medium"] {
  --background: var(--ion-color-medium);
  --color: white;
}
</style>
