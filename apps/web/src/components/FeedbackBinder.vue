<script setup lang="ts">
import { App as AntApp } from 'ant-design-vue';
import { bindFeedback, makeConfirm } from '@/composables/feedback';
import FeedbackHost from '@/components/FeedbackHost.vue';

/** 在 a-app 上下文内绑定主题化 message/confirm，并挂载全局 prompt 弹窗单实例。 */
const { message, modal } = AntApp.useApp();
bindFeedback({ message, confirm: makeConfirm(modal.confirm) });
</script>

<template>
  <FeedbackHost />
</template>
