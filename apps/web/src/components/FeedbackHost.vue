<script setup lang="ts">
import { ref, watch } from 'vue';
import { ExclamationCircleFilled } from '@ant-design/icons-vue';
import { promptState, settlePrompt } from '@/composables/feedback';

/** 全局输入弹窗单实例（替代 ElMessageBox.prompt），挂在 FeedbackBinder 内。 */
const input = ref('');
const inputRef = ref<{ focus: () => void }>();
const error = ref('');

watch(
  () => promptState.open,
  (open) => {
    if (open) {
      input.value = '';
      error.value = '';
      // 等 modal 挂载后聚焦
      window.setTimeout(() => inputRef.value?.focus(), 80);
    }
  },
);

function onOk(): void {
  const value = input.value;
  const res = promptState.validate?.(value) ?? (value.trim() ? true : '输入不能为空');
  if (res !== true) {
    error.value = res;
    return;
  }
  settlePrompt(value);
}

function onCancel(): void {
  settlePrompt(null);
}
</script>

<template>
  <a-modal
    :open="promptState.open"
    :title="promptState.title"
    :width="440"
    :mask-closable="false"
    :ok-text="promptState.okText"
    :ok-button-props="{ danger: promptState.danger }"
    cancel-text="取消"
    @ok="onOk"
    @cancel="onCancel"
  >
    <template #title>
      <span class="prompt-title-wrap">
        <ExclamationCircleFilled v-if="promptState.danger" class="prompt-danger-icon" />
        {{ promptState.title }}
      </span>
    </template>
    <p v-if="promptState.message" class="prompt-message">{{ promptState.message }}</p>
    <a-input
      ref="inputRef"
      v-model:value="input"
      :placeholder="promptState.placeholder"
      :status="error ? 'error' : ''"
      :aria-label="promptState.title"
      :aria-invalid="error ? 'true' : undefined"
      aria-describedby="prompt-error-text"
      @press-enter="onOk"
    />
    <p v-if="error" id="prompt-error-text" class="prompt-error" role="alert">{{ error }}</p>
  </a-modal>
</template>

<style scoped>
.prompt-title-wrap {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.prompt-danger-icon {
  color: var(--sasu-color-danger);
}
.prompt-message {
  color: var(--sasu-text-secondary);
  margin: 0 0 8px;
}
.prompt-error {
  color: var(--sasu-color-danger);
  font-size: 12px;
  margin: 6px 0 0;
}
</style>
