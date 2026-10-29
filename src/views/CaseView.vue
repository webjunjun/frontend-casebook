<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import CaseSidebar from '../components/CaseSidebar.vue'
import CaseViewer from '../components/CaseViewer.vue'
import { findCase } from '../config/cases'

const route = useRoute()

const caseDef = computed(() => {
  const raw = route.params.caseId
  const caseId = Array.isArray(raw) ? raw[0] : raw
  return caseId ? findCase(caseId) : undefined
})
</script>

<template>
  <div class="case-page">
    <CaseSidebar />
    <CaseViewer v-if="caseDef" :case-def="caseDef" />
  </div>
</template>

<style scoped>
.case-page {
  display: grid;
  grid-template-columns: 340px minmax(0, 1fr);
  gap: 16px;
  height: 100%;
  padding: 16px;
  min-height: 0;
}

@media (max-width: 860px) {
  .case-page {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: auto auto;
    gap: 10px;
    height: auto;
    min-height: 100%;
    padding: 10px;
  }
}
</style>
