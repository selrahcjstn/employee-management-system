import {
  AxiosError,
  type AxiosAdapter,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';
import { api, authClient } from '../shared/api/client';
import type { Session } from '../shared/api/types';

export interface FakeReply {
  status: number;
  data?: unknown;
}

export interface RecordedCall {
  method: string;
  url: string;
  authorization: string | undefined;
  body: unknown;
}

type Handler = (call: RecordedCall) => FakeReply | Promise<FakeReply>;

export const delay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Replaces the network for both API clients. The interceptors still run, so a test exercises the
 * real token handling and refresh logic against a scripted server.
 */
export function installFakeServer(handler: Handler): RecordedCall[] {
  const calls: RecordedCall[] = [];

  const adapter: AxiosAdapter = async (config: InternalAxiosRequestConfig) => {
    const authorization = config.headers.get('Authorization');
    const call: RecordedCall = {
      method: (config.method ?? 'get').toUpperCase(),
      url: config.url ?? '',
      authorization: authorization ? String(authorization) : undefined,
      body:
        typeof config.data === 'string' ? JSON.parse(config.data) : config.data,
    };
    calls.push(call);

    const { status, data } = await handler(call);
    const response: AxiosResponse = {
      data,
      status,
      statusText: String(status),
      headers: {},
      config,
    };
    if (status >= 200 && status < 300) return response;
    throw new AxiosError(
      `Request failed with status code ${status}`,
      AxiosError.ERR_BAD_REQUEST,
      config,
      undefined,
      response,
    );
  };

  api.defaults.adapter = adapter;
  authClient.defaults.adapter = adapter;
  return calls;
}

export const adminSession = (accessToken = 'token-1'): Session => ({
  accessToken,
  user: {
    id: '11111111-1111-4111-8111-111111111111',
    email: 'admin@example.com',
    fullName: 'Ada Admin',
    role: 'admin',
    isActive: true,
    createdAt: '2026-11-13T00:00:00.000Z',
    updatedAt: '2026-11-13T00:00:00.000Z',
  },
});

export const apiError = (
  statusCode: number,
  message: string,
  errors: string[] = [],
): FakeReply => ({
  status: statusCode,
  data: { statusCode, message, errors },
});
