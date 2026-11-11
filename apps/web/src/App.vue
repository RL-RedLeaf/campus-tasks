<script setup lang="ts">
import zhCN from 'ant-design-vue/es/locale/zh_CN';
import { antdTheme } from '@/theme';
import FeedbackBinder from '@/components/FeedbackBinder.vue';

// 布局壳由路由决定：学生/公共页 TopNavShell（顶部导航），管理/教师页 AdminShell（侧边栏），
// 登录与 404/403 独立成页，均在本层 RouterView 内渲染。
</script>

<template>
  <a-config-provider :locale="zhCN" :theme="antdTheme">
    <a-app>
      <FeedbackBinder />
      <RouterView />
    </a-app>
  </a-config-provider>
</template>
