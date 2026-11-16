<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  AccountBookOutlined,
  AppstoreOutlined,
  AuditOutlined,
  BarChartOutlined,
  BellOutlined,
  DashboardOutlined,
  FileDoneOutlined,
  FileSearchOutlined,
  FlagOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  NotificationOutlined,
  PlusCircleOutlined,
  ProfileOutlined,
  SettingOutlined,
  TeamOutlined,
  WalletOutlined,
} from '@ant-design/icons-vue';
import { labelOf } from '@sasu/shared';
import { useAuthStore } from '@/stores/auth';
import { useNotificationStore } from '@/stores/notification';

/** 管理 / 教师端布局：白色侧边栏 + 顶栏（页标题 + 通知 + 用户）。 */
interface MenuItem {
  /** 对应路由 name（用于选中态） */
  key: string;
  /** 跳转路径 */
  path: string;
  label: string;
  icon: typeof DashboardOutlined;
}

/** 菜单分组（按职能） */
interface MenuGroup {
  title: string;
  items: MenuItem[];
}

const auth = useAuthStore();
const notify = useNotificationStore();
const route = useRoute();
const router = useRouter();

const collapsed = ref(false);
const roleLabel = labelOf.role;

const isAdmin = computed(() => auth.role === 'ADMIN');

/** 管理端：工作台独立在最前，其余 12 项按职能分组（运营 / 资金 / 风控 / 系统）。 */
const adminTop: MenuItem[] = [
  { key: 'admin-dashboard', path: '/admin', label: '工作台', icon: DashboardOutlined },
];

const adminGroups: MenuGroup[] = [
  {
    title: '运营',
    items: [
      { key: 'admin-users', path: '/admin/users', label: '用户管理', icon: TeamOutlined },
      { key: 'admin-categories', path: '/admin/categories', label: '任务分类', icon: AppstoreOutlined },
      { key: 'admin-tasks', path: '/admin/tasks', label: '任务定价', icon: ProfileOutlined },
      { key: 'teacher-tasks', path: '/teacher/tasks', label: '任务验收', icon: FileDoneOutlined },
      {
        key: 'admin-announcements',
        path: '/admin/announcements',
        label: '公告管理',
        icon: NotificationOutlined,
      },
    ],
  },
  {
    title: '资金',
    items: [
      { key: 'admin-points', path: '/admin/points', label: '积分池', icon: WalletOutlined },
      {
        key: 'admin-withdrawals',
        path: '/admin/withdrawals',
        label: '提现审批',
        icon: AccountBookOutlined,
      },
    ],
  },
  {
    title: '风控',
    items: [
      { key: 'admin-disputes', path: '/admin/disputes', label: '仲裁处理', icon: AuditOutlined },
      { key: 'admin-reports', path: '/admin/reports', label: '举报处理', icon: FlagOutlined },
      { key: 'admin-audit', path: '/admin/audit', label: '审计日志', icon: FileSearchOutlined },
    ],
  },
  {
    title: '系统',
    items: [
      { key: 'admin-settings', path: '/admin/settings', label: '系统配置', icon: SettingOutlined },
      { key: 'admin-stats', path: '/admin/stats', label: '平台统计', icon: BarChartOutlined },
    ],
  },
];

const teacherMenu: MenuItem[] = [
  { key: 'teacher-tasks', path: '/teacher/tasks', label: '我的任务', icon: FileDoneOutlined },
  { key: 'task-new', path: '/tasks/new', label: '发布任务', icon: PlusCircleOutlined },
];

const pageTitle = computed(() => (route.meta.title as string) ?? '');
const selectedKeys = computed(() => [String(route.name)]);

async function onLogout(): Promise<void> {
  await auth.logout();
  notify.stopPolling();
  void router.push('/login');
}

/** 小屏（<lg，即 <992px，与 sider breakpoint="lg" 一致）跳转后自动收起侧栏。 */
function onMenuClick(path: string): void {
  if (window.matchMedia('(max-width: 991px)').matches) collapsed.value = true;
  void router.push(path);
}

onMounted(() => {
  // 初始即处于小屏时（breakpoint 仅在跨过阈值时触发）先收起侧栏。
  if (window.matchMedia('(max-width: 991px)').matches) collapsed.value = true;
});

if (auth.isLoggedIn) notify.startPolling();
</script>

<template>
  <a-layout class="admin-shell">
    <a-layout-sider
      v-model:collapsed="collapsed"
      :trigger="null"
      collapsible
      theme="light"
      breakpoint="lg"
      :width="224"
      collapsed-width="64"
      class="sider"
    >
      <RouterLink to="/" class="sider-brand">
        <img class="brand-badge" src="/school-badge.png" alt="上海科技大学附属学校校徽" />
        <span v-if="!collapsed" class="brand-name">校园任务平台</span>
      </RouterLink>
      <a-menu mode="inline" :selected-keys="selectedKeys" class="sider-menu">
        <template v-if="isAdmin">
          <a-menu-item v-for="item in adminTop" :key="item.key" @click="onMenuClick(item.path)">
            <component :is="item.icon" class="menu-icon" />
            <span>{{ item.label }}</span>
          </a-menu-item>
          <a-menu-item-group v-for="group in adminGroups" :key="group.title" :title="group.title">
            <a-menu-item v-for="item in group.items" :key="item.key" @click="onMenuClick(item.path)">
              <component :is="item.icon" class="menu-icon" />
              <span>{{ item.label }}</span>
            </a-menu-item>
          </a-menu-item-group>
        </template>
        <template v-else>
          <a-menu-item v-for="item in teacherMenu" :key="item.key" @click="onMenuClick(item.path)">
            <component :is="item.icon" class="menu-icon" />
            <span>{{ item.label }}</span>
          </a-menu-item>
        </template>
      </a-menu>
      <div class="sider-footer">
        <a-button type="text" class="collapse-btn" @click="collapsed = !collapsed">
          <MenuUnfoldOutlined v-if="collapsed" />
          <MenuFoldOutlined v-else />
        </a-button>
      </div>
    </a-layout-sider>

    <a-layout>
      <a-layout-header class="topbar">
        <div class="topbar-left">
          <h1 class="page-title">{{ pageTitle }}</h1>
        </div>
        <div class="topbar-right">
          <RouterLink to="/notifications" class="bell" aria-label="站内通知">
            <a-badge :count="notify.unread" size="small">
              <BellOutlined />
            </a-badge>
          </RouterLink>
          <a-dropdown v-if="auth.user">
            <span class="user-chip">
              <span class="avatar">{{ auth.user.name.slice(0, 1) }}</span>
              <span class="user-name">{{ auth.user.name }}</span>
              <span class="user-role">{{ roleLabel(auth.user.role) }}</span>
            </span>
            <template #overlay>
              <a-menu>
                <a-menu-item key="profile" @click="router.push('/profile')">个人中心</a-menu-item>
                <a-menu-divider />
                <a-menu-item key="logout" @click="onLogout">退出登录</a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
        </div>
      </a-layout-header>
      <a-layout-content class="content">
        <RouterView />
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<style scoped>
.admin-shell {
  min-height: 100vh;
}
.sider {
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--sasu-border);
}
.sider :deep(.ant-layout-sider-children) {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.sider-brand {
  height: 60px;
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 0 16px;
  cursor: pointer;
  border-bottom: 1px solid var(--sasu-border);
  flex-shrink: 0;
  text-decoration: none;
  color: inherit;
}
.brand-badge {
  width: 30px;
  height: 30px;
  flex-shrink: 0;
}
.brand-name {
  font-size: 15px;
  font-weight: 700;
  color: var(--sasu-text-primary);
  white-space: nowrap;
}
.sider-menu {
  flex: 1;
  padding-top: 8px;
  border-inline-end: none !important;
  overflow-y: auto;
  background: transparent;
}
.sider-menu :deep(.ant-menu-item) {
  margin-inline: 8px;
  width: calc(100% - 16px);
  border-radius: 8px;
}
.sider-menu :deep(.ant-menu-item-selected) {
  background: var(--sasu-color-primary-light-bg);
  color: var(--sasu-color-primary);
  font-weight: 500;
}
.sider-menu :deep(.ant-menu-item-group-title) {
  padding: 12px 16px 4px;
  color: var(--sasu-text-tertiary);
  font-size: 12px;
}
/* 折叠态（含小屏自动折叠）隐藏分组标题，避免 64px 宽度下文字挤压。 */
.sider-menu :deep(.ant-menu-inline-collapsed .ant-menu-item-group-title) {
  display: none;
}
.menu-icon {
  font-size: 15px;
}
.sider-footer {
  padding: 10px 8px;
  border-top: 1px solid var(--sasu-border);
  flex-shrink: 0;
}
.collapse-btn {
  width: 100%;
  color: var(--sasu-text-secondary);
}
.topbar {
  height: 60px;
  background: var(--sasu-bg-card);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  border-bottom: 1px solid var(--sasu-border);
  line-height: normal;
}
.topbar-left {
  display: flex;
  align-items: center;
}
.page-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--sasu-text-primary);
}
.topbar-right {
  display: flex;
  align-items: center;
  gap: 16px;
}
.bell {
  color: var(--sasu-text-secondary);
  font-size: 17px;
  line-height: 1;
  text-decoration: none;
}
.bell:hover {
  color: var(--sasu-text-primary);
}
.user-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}
.avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--sasu-color-primary);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.user-name {
  color: var(--sasu-text-primary);
  font-size: 14px;
  font-weight: 500;
}
.user-role {
  color: var(--sasu-text-tertiary);
  font-size: 12px;
}
.content {
  padding: 24px;
}
</style>
