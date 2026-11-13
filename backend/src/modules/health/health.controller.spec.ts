import { ServiceUnavailableException } from '@nestjs/common';
import type { PrismaService } from '../../prisma/prisma.service.js';
import { HealthController } from './health.controller.js';

const controllerWith = (ping: () => Promise<void>) =>
  new HealthController({ ping } as unknown as PrismaService);

describe('HealthController', () => {
  afterEach(() => vi.useRealTimers());

  it('reports the database as up', async () => {
    await expect(
      controllerWith(async () => undefined).check(),
    ).resolves.toEqual({
      status: 'ok',
      database: 'up',
    });
  });

  it('answers 503, not 500, when the database cannot be reached', async () => {
    const controller = controllerWith(async () => {
      throw new Error('connect ECONNREFUSED');
    });
    await expect(controller.check()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it('queries the database at most once per second, however often it is called', async () => {
    vi.useFakeTimers();
    const ping = vi.fn(async () => undefined);
    const controller = controllerWith(ping);

    for (let i = 0; i < 50; i++) await controller.check();
    expect(ping).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(1001);
    await controller.check();
    expect(ping).toHaveBeenCalledTimes(2);
  });

  it('does not cache a failure: the next call checks again and recovers', async () => {
    const ping = vi
      .fn<() => Promise<void>>()
      .mockRejectedValueOnce(new Error('down'))
      .mockResolvedValue(undefined);
    const controller = controllerWith(ping);

    await expect(controller.check()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
    await expect(controller.check()).resolves.toEqual({
      status: 'ok',
      database: 'up',
    });
    expect(ping).toHaveBeenCalledTimes(2);
  });
});
