import axios, { type AxiosRequestConfig } from 'axios';
import { Modal } from 'ant-design-vue';
import { ErrorCode, HttpStatusByCode, MessageByCode, type ApiResponse } from '@sasu/shared';

/** 归一化后的业务错误：调用方 catch 后可直接展示 friendlyMessage */
export interface NormalizedError extends Error {
  code?: number;
  httpStatus?: number;
  friendlyMessage: string;
}

/**
 * 会话失效全局处理（PRD AUTH-06：禁用/改密后下一次请求即 401）。
 * 弹一次性提示并带 redirect 跳登录页；排除登录接口与启动时的 /auth/me 探测，
 * 避免登录失败、未登录首访误触发。整页跳转可顺带清空 Pinia 内存态。
 */
let sessionExpiredShowing = false;

function handleSessionExpired(): void {
  if (sessionExpiredShowing) return;
  const { pathname, search } = window.location;
  if (pathname.startsWith('/login')) return;
  sessionExpiredShowing = true;
  Modal.warning({
    title: '登录已失效',
    content: '你的登录状态已过期，请重新登录后继续操作。',
    okText: '重新登录',
    onOk: () => {
      const redirect = encodeURIComponent(pathname + search);
      window.location.href = `/login?redirect=${redirect}`;
    },
    afterClose: () => {
      sessionExpiredShowing = false;
    },
  });
}

/**
 * 统一请求封装（PRD §12.1）：baseURL /api/v1，错误码集中处理。
 * 幂等头 Idempotency-Key、If-Match 乐观锁在 M2 各命令类接口接入。
 */
export const http = axios.create({
  baseURL: '/api/v1',
  timeout: 15_000,
  withCredentials: true,
});

http.interceptors.response.use(
  (response) => response,
  (error) => {
    const configUrl = (error?.config?.url ?? '') as string;
    const code = error?.response?.data?.code as number | undefined;
    const serverMessage = error?.response?.data?.message as string | undefined;
    const known = code !== undefined && code in MessageByCode;
    const friendly =
      serverMessage ??
      (known ? MessageByCode[code as keyof typeof MessageByCode] : '网络异常，请稍后重试');
    const normalized: NormalizedError = Object.assign(new Error(friendly), {
      code,
      httpStatus: known ? HttpStatusByCode[code as keyof typeof HttpStatusByCode] : undefined,
      friendlyMessage: friendly,
    });
    // 会话失效（非登录请求、非启动探测、非登录页）：全局弹窗引导重登
    const isAuthProbe = configUrl === '/auth/login' || configUrl === '/auth/me';
    if ((code === ErrorCode.UNAUTHORIZED || error?.response?.status === 401) && !isAuthProbe) {
      handleSessionExpired();
    }
    return Promise.reject(normalized);
  },
);

/** 解开统一信封 { code, message, data }（PRD §12.1），直接返回 data */
export async function request<T>(config: AxiosRequestConfig): Promise<T> {
  const response = await http.request<ApiResponse<T>>(config);
  return response.data.data as T;
}
