import type { ThemeConfig } from 'ant-design-vue/es/config-provider/context';

/**
 * Ant Design Vue 全局主题令牌 —— 「清爽现代风」设计语言（2026-11 全站重设计）。
 * 原则：白底浅灰画布、细边框卡片、克制的品牌红点缀、灰阶层级清晰。
 * 主色 #B4232A（PRD §13.2）仅用于关键动作/强调数字/激活态。
 * 组件级外观（表格表头、侧边菜单等）在 styles/tokens.css 与各布局壳的 scoped
 * 样式里用 CSS 覆盖——antd-vue 4.x 的组件 token 命名与 React 版不一致，CSS 更稳。
 */
export const antdTheme: ThemeConfig = {
  token: {
    colorPrimary: '#b4232a',
    colorLink: '#b4232a',
    colorInfo: '#1f4e79',
    // Alert/Tag 等信息底色由 colorInfo 自动派生，深藏青会派生出灰蓝底；
    // 显式指定浅色（sasu 副色底）保持「中性提示」观感
    colorInfoBg: '#f0f5fa',
    colorInfoBgHover: '#e4eef6',
    colorInfoBorder: '#cfdeed',
    colorSuccess: '#2e7d5b',
    colorWarning: '#c77700',
    colorError: '#c0392b',
    colorTextBase: '#1f2329',
    colorBgLayout: '#f7f8fa',
    colorBorder: '#d5d9e0',
    colorBorderSecondary: '#e8ecf1',
    borderRadius: 10,
    borderRadiusLG: 14,
    fontFamily: "-apple-system, 'PingFang SC', 'Microsoft YaHei', sans-serif",
    boxShadow: '0 6px 24px rgba(16, 24, 40, 0.08)',
    boxShadowSecondary: '0 2px 8px rgba(16, 24, 40, 0.06)',
  },
};
