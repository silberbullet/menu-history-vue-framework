<script setup></script>

<template>
  <router-view />
  <!-- 공통 모달(알럿, 컨펌창) 등록  -->
  <ConfirmDialog />
  <!-- 비동기 로딩바 등록 -->
  <TnLoadingBar type="async" />
</template>

<style scoped></style>
