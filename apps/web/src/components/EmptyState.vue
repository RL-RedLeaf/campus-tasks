<script setup lang="ts">
import { Empty } from 'ant-design-vue';

defineProps<{ description?: string }>();
</script>

<template>
  <!-- 简洁小插图：与清爽现代风、表格内置空态观感一致 -->
  <a-empty :image="Empty.PRESENTED_IMAGE_SIMPLE" :description="description ?? '这里还没有内容'">
    <slot />
  </a-empty>
</template>
