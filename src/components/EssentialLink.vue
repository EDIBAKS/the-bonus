<template>
<q-item
  v-if="props.to"
  clickable
  tag="router-link"
  :to="props.to"
>
  <q-item-section v-if="props.icon" avatar>
    <q-icon :name="props.icon" />
  </q-item-section>

  <q-item-section>
    <q-item-label>{{ props.title }}</q-item-label>
  </q-item-section>
</q-item>

<q-item
  v-else
  clickable
  tag="a"
  target="_blank"
  :href="props.link"
>
  <q-item-section v-if="props.icon" avatar>
    <q-icon :name="props.icon" />
  </q-item-section>

  <q-item-section>
    <q-item-label>{{ props.title }}</q-item-label>
  </q-item-section>
</q-item>

</template>

<script setup>
defineOptions({
  name: 'EssentialLink'
})

const props = defineProps({
  title: {
    type: String,
    required: true
  },

  caption: {
    type: String,
    default: ''
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
</script>
