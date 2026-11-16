<script setup lang="ts">
import { onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { message } from '@/composables/feedback';
import {
  ClockCircleOutlined,
  EnvironmentOutlined,
  UserOutlined,
  SearchOutlined,
  ReloadOutlined,
  GoldOutlined,
} from '@ant-design/icons-vue';
import { categoriesApi, type CategoryRow } from '@/api/admin';
import { tasksApi, type PageData, type TaskSummary } from '@/api/tasks';
import type { NormalizedError } from '@/api/http';
import EmptyState from '@/components/EmptyState.vue';
import StatusTag from '@/components/StatusTag.vue';
import AppPagination from '@/components/AppPagination.vue';
import { useAuthStore } from '@/stores/auth';
import { pointsApi } from '@/api/points';

const auth = useAuthStore();
const myPoints = ref<{ balance: number } | null>(null);

const PAGE_SIZE = 20;

function teacherLabel(name?: string): string {
  if (!name) return '—';
  return name.endsWith('老师') ? name : name + '老师';
}

const router = useRouter();
const route = useRoute();

const categories = ref<CategoryRow[]>([]);
const items = ref<TaskSummary[]>([]);
const total = ref(0);
const page = ref(1);
const loading = ref(false);
const loadError = ref(false);
const filters = reactive({
  categoryId: undefined as number | undefined,
  status: undefined as string | undefined,
  minReward: undefined as number | undefined,
  maxReward: undefined as number | undefined,
  keyword: '',
  orderBy: 'latest',
});

const statusOptions = [
  { value: 'RECRUITING', label: '招募中' },
  { value: 'FULL', label: '已满' },
  { value: 'CLOSED', label: '已截止' },
  { value: 'SETTLED', label: '已完成' },
  { value: 'CANCELLED', label: '已取消' },
  { value: 'OFFLINE', label: '已下架' },
];
const sortOptions = [
  { value: 'latest', label: '最新发布' },
  { value: 'deadline', label: '即将截止' },
  { value: 'reward', label: '积分最高' },
];

/** 倒计时用响应式时钟（30s 刷新一次） */
const now = ref(Date.now());
let timer: ReturnType<typeof setInterval> | null = null;

function remainingText(deadline: string | null | undefined): string {
  if (!deadline) return '';
  const diff = new Date(deadline).getTime() - now.value;
  if (diff <= 0) return '已截止';
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  if (days > 0) return `剩余 ${days} 天 ${hours} 小时`;
  if (hours > 0) return `剩余 ${hours} 小时 ${minutes} 分钟`;
  return `剩余 ${minutes} 分钟`;
}
function isUrgent(deadline: string | null | undefined): boolean {
  if (!deadline) return false;
  const diff = new Date(deadline).getTime() - now.value;
  return diff > 0 && diff < 24 * 3_600_000;
}

function buildParams(): Record<string, unknown> {
  const params: Record<string, unknown> = {
    page: page.value,
    pageSize: PAGE_SIZE,
    orderBy: filters.orderBy,
  };
  if (filters.categoryId) params.categoryId = filters.categoryId;
  if (filters.status) params.status = filters.status;
  if (filters.minReward !== undefined && filters.minReward !== null) params.minReward = filters.minReward;
  if (filters.maxReward !== undefined && filters.maxReward !== null) params.maxReward = filters.maxReward;
  const kw = filters.keyword.trim();
  if (kw) params.keyword = kw;
  return params;
}

async function load(): Promise<void> {
  loading.value = true;
  loadError.value = false;
  try {
    const data: PageData<TaskSummary> = await tasksApi.hall(buildParams());
    items.value = data.items;
    total.value = data.total;
  } catch (e) {
    loadError.value = true;
    message.error((e as NormalizedError).friendlyMessage ?? '加载失败');
  } finally {
    loading.value = false;
  }
}

// ---------- 筛选/页码与 URL query 双向同步（深链可分享） ----------
function queryFromState(): Record<string, string> {
  const q: Record<string, string> = { page: String(page.value), orderBy: filters.orderBy };
  if (filters.categoryId) q.categoryId = String(filters.categoryId);
  if (filters.status) q.status = filters.status;
  if (filters.minReward !== undefined && filters.minReward !== null) q.minReward = String(filters.minReward);
  if (filters.maxReward !== undefined && filters.maxReward !== null) q.maxReward = String(filters.maxReward);
  const kw = filters.keyword.trim();
  if (kw) q.keyword = kw;
  return q;
}
function applyQuery(): void {
  const q = route.query;
  const num = (v: unknown): number | undefined => {
    const n = Number(v);
    return v !== undefined && v !== null && v !== '' && Number.isFinite(n) && n > 0 ? n : undefined;
  };
  page.value = num(q.page) ?? 1;
  filters.categoryId = num(q.categoryId);
  filters.status = typeof q.status === 'string' && statusOptions.some((o) => o.value === q.status) ? q.status : undefined;
  filters.minReward = num(q.minReward);
  filters.maxReward = num(q.maxReward);
  filters.keyword = typeof q.keyword === 'string' ? q.keyword : '';
  filters.orderBy = typeof q.orderBy === 'string' && sortOptions.some((o) => o.value === q.orderBy) ? q.orderBy : 'latest';
}
function isSameQuery(a: Record<string, unknown>, b: Record<string, string>): boolean {
  const keys = Object.keys(b);
  if (keys.length !== Object.keys(a).length) return false;
  return keys.every((k) => String(a[k] ?? '') === b[k]);
}
/** 状态写回 URL；query 无变化时直接加载，避免 watch 触发重复请求 */
async function syncQueryAndLoad(): Promise<void> {
  const next = queryFromState();
  if (isSameQuery(route.query, next)) {
    await load();
    return;
  }
  await router.replace({ query: next }); // watch(route.query) 会负责还原状态并加载
}

function search(): void {
  page.value = 1;
  void syncQueryAndLoad();
}
function reset(): void {
  filters.categoryId = undefined;
  filters.status = undefined;
  filters.minReward = undefined;
  filters.maxReward = undefined;
  filters.keyword = '';
  filters.orderBy = 'latest';
  search();
}
function changePage(p: number): void {
  page.value = p;
  void syncQueryAndLoad();
  // 翻页后把页面主体滚回顶部，避免用户停留在长列表中部
  document.querySelector('.page')?.scrollIntoView({ behavior: 'smooth' });
}
function openDetail(id: string): void {
  void router.push(`/tasks/${id}`);
}

function quotaPercent(t: TaskSummary): number {
  const filled = t.headcount - (t.remaining ?? t.headcount - t.filledCount);
  if (t.headcount <= 0) return 0;
  return Math.min(100, Math.round((filled / t.headcount) * 100));
}

onMounted(async () => {
  timer = setInterval(() => {
    now.value = Date.now();
  }, 30_000);
  applyQuery(); // 从 URL query 还原筛选与页码（支持分享深链）
  try {
    const r = await categoriesApi.list();
    categories.value = r.items;
  } catch {
    // 分类加载失败不阻塞大厅
  }
  if (auth.role === 'STUDENT') {
    pointsApi.me().then((r) => (myPoints.value = r)).catch(() => undefined);
  }
  await load();
});
// 浏览器前进/后退或外部修改 query 时同步还原并重新加载（syncQueryAndLoad 写回相同 query 不会重复触发）
watch(
  () => route.query,
  () => {
    applyQuery();
    void load();
  },
);
onBeforeUnmount(() => {
  if (timer) clearInterval(timer);
});
</script>

<template>
  <section class="hall-hero">
    <div class="hero-text">
      <h2>任务大厅</h2>
      <p>先到先得接单，按时提交交付物，验收通过即刻获得积分</p>
    </div>
    <div v-if="auth.role === 'STUDENT' && myPoints" class="hero-chip">
      <GoldOutlined class="hero-chip-icon" />
      <span>我的可用积分</span>
      <b class="num">{{ myPoints.balance }}</b>
    </div>
  </section>

  <a-card class="filter-card">
    <div class="filter-bar">
      <a-select
        v-model:value="filters.categoryId"
        placeholder="全部分类"
        allow-clear
        show-search
        option-filter-prop="label"
        class="w-category"
        :options="categories.map((c) => ({ label: c.name, value: Number(c.id) }))"
        @change="search"
      />
      <a-select
        v-model:value="filters.status"
        placeholder="全部状态"
        allow-clear
        class="w-status"
        :options="statusOptions"
        @change="search"
      />
      <div class="reward-range">
        <span class="range-label">积分</span>
        <a-input-number
          v-model:value="filters.minReward"
          :min="1"
          :max="9999"
          :controls="false"
          placeholder="最低"
          class="w-num"
        />
        <span class="range-sep">—</span>
        <a-input-number
          v-model:value="filters.maxReward"
          :min="1"
          :max="9999"
          :controls="false"
          placeholder="最高"
          class="w-num"
        />
      </div>
      <a-select
        v-model:value="filters.orderBy"
        class="w-sort"
        :options="sortOptions"
        @change="search"
      />
      <a-input
        v-model:value="filters.keyword"
        placeholder="搜索任务标题 / 描述"
        allow-clear
        class="w-keyword"
        @keyup.enter="search"
        @clear="search"
      >
        <template #prefix><SearchOutlined class="search-prefix" /></template>
      </a-input>
      <a-button type="primary" @click="search">
        <template #icon><SearchOutlined /></template>
        搜索
      </a-button>
      <a-button @click="reset">
        <template #icon><ReloadOutlined /></template>
        重置
      </a-button>
    </div>
  </a-card>

  <a-spin :spinning="loading">
    <div class="list-area">
      <div v-if="items.length > 0" class="cards">
        <article
          v-for="t in items"
          :key="t.id"
          class="task-card sasu-keyable"
          role="link"
          tabindex="0"
          @click="openDetail(t.id)"
          @keydown.enter.prevent="openDetail(t.id)"
          @keydown.space.prevent="openDetail(t.id)"
        >
          <header class="card-head">
            <span class="cat">{{ t.category?.name ?? '未分类' }}</span>
            <StatusTag :status="t.status" />
          </header>
          <h3 class="title">{{ t.title }}</h3>
          <div class="meta">
            <span class="meta-item"><UserOutlined />{{ teacherLabel(t.teacher?.name) }}</span>
            <span v-if="t.location" class="meta-item"><EnvironmentOutlined />{{ t.location }}</span>
          </div>
          <div class="quota-line">
            <div class="quota-bar">
              <div class="quota-fill" :style="{ width: quotaPercent(t) + '%' }" />
            </div>
            <span class="quota-text">
              已报 <b>{{ t.headcount - (t.remaining ?? t.headcount - t.filledCount) }}</b> / {{ t.headcount }} 人
            </span>
          </div>
          <footer class="card-foot">
            <div class="reward">
              <span class="reward-num num">{{ t.rewardPerPerson ?? '—' }}</span>
              <span class="reward-unit">积分/人</span>
            </div>
            <span class="deadline" :class="{ urgent: isUrgent(t.deadlineAt) }">
              <ClockCircleOutlined />
              {{ isUrgent(t.deadlineAt) ? '即将截止 · ' : '' }}{{ remainingText(t.deadlineAt) }}
            </span>
          </footer>
        </article>
      </div>
      <EmptyState v-else-if="loadError" error @retry="load" />
      <EmptyState v-else-if="!loading" description="暂无符合条件的任务，换个筛选条件试试" />
    </div>
  </a-spin>

  <div class="pager">
    <AppPagination
      v-model:page="page"
      :page-size="PAGE_SIZE"
      :total="total"
      hide-on-single-page
      @change="changePage"
    />
  </div>
</template>

<style scoped>
.hall-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 6px 0 20px;
  margin-bottom: 4px;
}
.hall-hero h2 {
  margin: 0 0 4px;
  font-size: 24px;
  font-weight: 700;
  letter-spacing: 0.2px;
  color: var(--sasu-text-primary);
}
.hall-hero p {
  margin: 0;
  color: var(--sasu-text-secondary);
  font-size: 13px;
}
.hero-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 16px;
  background: var(--sasu-bg-card);
  border: 1px solid var(--sasu-border);
  border-radius: var(--sasu-radius-pill);
  box-shadow: var(--sasu-shadow-card);
  color: var(--sasu-text-secondary);
  font-size: 13px;
  white-space: nowrap;
}
.hero-chip-icon {
  color: var(--sasu-color-primary);
}
.hero-chip b {
  font-size: 17px;
  color: var(--sasu-color-primary);
  font-variant-numeric: tabular-nums;
}
.filter-card {
  margin-bottom: 16px;
  border-radius: var(--sasu-radius-base);
  box-shadow: var(--sasu-shadow-card);
}
.filter-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.w-category {
  width: 140px;
}
.w-status {
  width: 118px;
}
.w-sort {
  width: 118px;
}
.w-keyword {
  width: 230px;
}
.w-num {
  width: 90px;
}
.search-prefix {
  color: var(--sasu-text-secondary);
}
.reward-range {
  display: flex;
  align-items: center;
  gap: 6px;
}
.range-label {
  color: var(--sasu-text-secondary);
  font-size: 13px;
  white-space: nowrap;
}
.range-sep {
  color: var(--sasu-text-secondary);
}
.list-area {
  min-height: 200px;
}
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}
.task-card {
  display: flex;
  flex-direction: column;
  padding: 18px 20px;
  background: var(--sasu-bg-card);
  border: 1px solid var(--sasu-border);
  border-radius: var(--sasu-radius-card);
  box-shadow: var(--sasu-shadow-card);
  cursor: pointer;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    border-color 0.18s ease;
}
.task-card:hover {
  transform: translateY(-2px);
  border-color: var(--sasu-color-primary-light-border);
  box-shadow: var(--sasu-shadow-card-hover);
}
.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.cat {
  font-size: 12px;
  color: var(--sasu-text-secondary);
  background: var(--sasu-color-secondary-bg);
  padding: 2px 10px;
  border-radius: 999px;
}
.title {
  margin: 10px 0 8px;
  font-size: 16px;
  line-height: 1.4;
  color: var(--sasu-text-primary);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.meta {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}
.meta-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--sasu-text-secondary);
  font-size: 13px;
}
.meta-item .anticon {
  font-size: 14px;
}
.quota-line {
  margin-top: 12px;
  display: flex;
  align-items: center;
  gap: 10px;
}
.quota-bar {
  flex: 1;
  height: 6px;
  border-radius: 999px;
  background: var(--sasu-border);
  overflow: hidden;
}
.quota-fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, var(--sasu-color-primary), var(--sasu-color-gradient-end));
  transition: width 0.3s ease;
}
.quota-text {
  font-size: 12px;
  color: var(--sasu-text-secondary);
  white-space: nowrap;
}
.quota-text b {
  color: var(--sasu-text-primary);
}
.card-foot {
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid var(--sasu-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.reward-num {
  font-size: 20px;
  color: var(--sasu-color-primary);
}
.reward-unit {
  margin-left: 4px;
  font-size: 12px;
  color: var(--sasu-text-secondary);
}
.deadline {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--sasu-text-secondary);
}
.deadline.urgent {
  color: var(--sasu-color-danger);
  background: var(--sasu-color-danger-light-bg);
  padding: 2px 10px;
  border-radius: 999px;
}
.pager {
  margin-top: 16px;
  display: flex;
  justify-content: center;
}
@media (max-width: 767px) {
  /* 窄屏单列卡片，避免 minmax(320px, 1fr) 在 <768px 时仍挤出两列 */
  .cards {
    grid-template-columns: 1fr;
  }
  .hall-hero {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
}
</style>
