<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { BellOutlined } from '@ant-design/icons-vue';
import { labelOf } from '@sasu/shared';
import { useAuthStore } from '@/stores/auth';
import { useNotificationStore } from '@/stores/notification';

/** 学生端 / 公共页布局：白色吸顶导航 + 1200px 内容列（清爽现代风）。 */
const auth = useAuthStore();
const notify = useNotificationStore();
const route = useRoute();
const router = useRouter();

const isStudent = computed(() => auth.role === 'STUDENT');
const isTeacher = computed(() => auth.role === 'TEACHER' || auth.role === 'ADMIN');

const roleLabel = labelOf.role;

function isActive(name: string): boolean {
  return route.name === name;
}

async function onLogout(): Promise<void> {
  await auth.logout();
  notify.stopPolling();
  void router.push('/login');
}

if (auth.isLoggedIn) notify.startPolling();
</script>

<template>
  <div class="top-shell">
    <header class="topbar">
      <div class="topbar-inner">
        <div class="brand" @click="router.push('/')">
          <span class="brand-dot" />
          <span class="brand-name">校园任务平台</span>
        </div>
        <nav class="nav">
          <RouterLink class="nav-item" :class="{ active: isActive('home') }" to="/">首页</RouterLink>
          <RouterLink class="nav-item" :class="{ active: isActive('hall') }" to="/tasks">任务大厅</RouterLink>
          <RouterLink
            v-if="isStudent"
            class="nav-item"
            :class="{ active: isActive('my-tasks') }"
            to="/my/tasks"
          >
            我的任务
          </RouterLink>
          <RouterLink
            v-if="isStudent"
            class="nav-item"
            :class="{ active: isActive('points') }"
            to="/points"
          >
            我的积分
          </RouterLink>
          <template v-if="isTeacher">
            <RouterLink
              class="nav-item"
              :class="{ active: isActive('teacher-tasks') || isActive('teacher-task') }"
              to="/teacher/tasks"
            >
              任务管理
            </RouterLink>
            <RouterLink class="nav-item" to="/tasks/new">发布任务</RouterLink>
          </template>
        </nav>
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
          <a-button v-else type="primary" size="small" @click="router.push('/login')">登录</a-button>
        </div>
      </div>
    </header>
    <main class="page">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.top-shell {
  min-height: 100%;
  display: flex;
  flex-direction: column;
}
.topbar {
  position: sticky;
  top: 0;
  z-index: 20;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid var(--sasu-border);
}
.topbar-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  height: 60px;
  display: flex;
  align-items: center;
  gap: 28px;
}
.brand {
  display: flex;
  align-items: center;
  gap: 9px;
  cursor: pointer;
  white-space: nowrap;
}
.brand-dot {
  width: 12px;
  height: 12px;
  border-radius: 4px;
  background: var(--sasu-color-primary);
  box-shadow: 0 0 0 3px var(--sasu-color-primary-light-bg);
}
.brand-name {
  font-size: 16px;
  font-weight: 700;
  color: var(--sasu-text-primary);
  letter-spacing: 0.2px;
}
.nav {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1;
  min-width: 0;
  overflow-x: auto;
}
.nav-item {
  padding: 6px 14px;
  border-radius: var(--sasu-radius-pill);
  color: var(--sasu-text-secondary);
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  transition: background 0.15s, color 0.15s;
}
.nav-item:hover {
  color: var(--sasu-text-primary);
  background: var(--sasu-bg-hover);
}
.nav-item.active {
  color: var(--sasu-color-primary);
  background: var(--sasu-color-primary-light-bg);
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
.page {
  flex: 1;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 28px 24px 48px;
}
</style>
