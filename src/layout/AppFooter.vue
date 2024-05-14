<script setup>
import { onMounted, ref } from "vue";

const footerContext = ref(null);

onMounted(() => {
  footerContext.value = "Copyright 2024 TENNOD SOLUTION CO.,Ltd. All Rights Reserved.";
});
</script>

<template>
  <div>
    <span>{{ footerContext }}</span>
  </div>
</template>
<style lang="scss" scoped></style>
