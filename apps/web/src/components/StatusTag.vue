<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{ status: string }>();

/** 状态标签（点式，清爽现代风）：色点 + 文字。
 *  任务/流转状态：待定价=橙、招募中=品牌红、已满/已取消=灰、待验收=橙、已完成=绿、违约/驳回=红 */
const MAP: Record<string, { label: string; tone: 'brand' | 'success' | 'warning' | 'danger' | 'muted' }> = {
  PENDING_REWARD: { label: '待定价', tone: 'warning' },
  RECRUITING: { label: '招募中', tone: 'brand' },
  FULL: { label: '已满', tone: 'muted' },
  OFFLINE: { label: '已下架', tone: 'muted' },
  CLOSED: { label: '已截止', tone: 'muted' },
  SETTLED: { label: '已完成', tone: 'success' },
  CANCELLED: { label: '已取消', tone: 'muted' },
  CLAIMED: { label: '进行中', tone: 'brand' },
  SUBMITTED: { label: '待验收', tone: 'warning' },
  ACCEPTED: { label: '已通过', tone: 'success' },
  REJECTED: { label: '被驳回', tone: 'danger' },
  FAILED: { label: '未完成', tone: 'danger' },
  OVERDUE: { label: '违约', tone: 'danger' },
  WITHDRAWN: { label: '已取消', tone: 'muted' },
  CANCELLED_BY_TEACHER: { label: '已取消', tone: 'muted' },
  PENDING: { label: '待审批', tone: 'warning' },
  APPROVED: { label: '待发放', tone: 'brand' },
  PAID: { label: '已发放', tone: 'success' },
  WITHDRAWN_W: { label: '已撤回', tone: 'muted' },
  OPEN: { label: '进行中', tone: 'brand' },
  RESOLVED: { label: '已裁定', tone: 'success' },
  REJECTED_D: { label: '已驳回', tone: 'muted' },
  // 账号状态（原 EP 直接展示英文原值，此处补中文映射）
  ACTIVE: { label: '正常', tone: 'success' },
  DISABLED: { label: '已禁用', tone: 'danger' },
};

const info = computed(() => MAP[props.status] ?? { label: props.status, tone: 'muted' as const });
</script>

<template>
  <span class="status" :class="info.tone">
    <i class="dot" />
    <span class="text">{{ info.label }}</span>
  </span>
</template>

<style scoped>
.status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}
.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}
.text {
  font-size: 13px;
  font-weight: 500;
}
.status.brand .dot {
  background: var(--sasu-color-primary);
}
.status.brand .text {
  color: var(--sasu-color-primary);
}
.status.success .dot {
  background: var(--sasu-color-success);
}
.status.success .text {
  color: var(--sasu-color-success);
}
.status.warning .dot {
  background: var(--sasu-color-warning);
}
.status.warning .text {
  color: var(--sasu-color-warning);
}
.status.danger .dot {
  background: var(--sasu-color-danger);
}
.status.danger .text {
  color: var(--sasu-color-danger);
}
.status.muted .dot {
  background: #b9c0c9;
}
.status.muted .text {
  color: var(--sasu-text-tertiary);
}
</style>
