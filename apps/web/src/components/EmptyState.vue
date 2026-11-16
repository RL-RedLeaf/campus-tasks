<script setup lang="ts">
import { Empty } from 'ant-design-vue';

defineProps<{
  description?: string;
  /** 加载失败态：展示错误文案 + 重试按钮，与「暂无数据」区分（PRD §8.4 #5） */
  error?: boolean;
}>();

const emit = defineEmits<{ retry: [] }>();
</script>

<template>
  <!-- 简洁小插图：与清爽现代风、表格内置空态观感一致 -->
  <a-empty
    :image="Empty.PRESENTED_IMAGE_SIMPLE"
    :description="error ? '加载失败，请稍后重试' : (description ?? '这里还没有内容')"
  >
    <a-button v-if="error" type="primary" @click="emit('retry')">重试</a-button>
    <slot v-else />
  </a-empty>
</template>
