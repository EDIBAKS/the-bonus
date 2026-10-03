<template>
  <q-item
    clickable
    :class="route.path === props.link ? 'text-orange-5' : 'text-white'"
    :to="props.link"
  >
    <q-item-section
      v-if="props.icon"
      avatar
    >
      <q-icon :name="props.icon" />
    </q-item-section>

    <q-item-section>
      <q-item-label>{{ props.title }}</q-item-label>
    
    </q-item-section>
  </q-item>
</template>

<script setup>
import { useRoute } from 'vue-router'

defineOptions({
  name: 'EssentialLink'
})

const props = defineProps({
  title: {
    type: String,
    required: true
  },



  link: {
    type: String,
    default: '#'
  },

  icon: {
    type: String,
    default: ''
  }
})

const route = useRoute()
</script>
