import { Logger } from '@nestjs/common';
import type {
  DiscoveryService,
  MetadataScanner,
  ModuleRef,
} from '@nestjs/core';
import { AUDIT_RECORDER_DI_TOKEN } from 'modules/audit/audit.di-token';
import { AuditRecorder } from 'modules/audit/application/ports/audit-recorder.port';
import {
  Audited,
  AuditedOptions,
} from 'modules/audit/application/audited.decorator';
import { AuditExplorer } from 'modules/audit/infrastructure/audit.explorer';

jest.mock('@nestjs/core', () => ({
  DiscoveryService: jest.fn(),
  MetadataScanner: jest.fn(),
  ModuleRef: jest.fn(),
}));

interface TestCommand {
  actorId: string;
  entityId: string;
  lockReason: string;
}

interface TestResult {
  id: string;
  label: string;
}

function createHandler(
  options: Partial<AuditedOptions<TestCommand, TestResult>> = {},
) {
  class TestHandler {
    readonly prefix = 'handled:';
    error?: Error;

    @Audited<TestCommand, TestResult>({
      action: 'user.locked',
      entityType: 'user',
      actorId: (command) => command.actorId,
      entityId: (_command, result) => result.id,
      metadata: (command, result) => ({
        lockReason: command.lockReason,
        label: result.label,
      }),
      ...options,
    })
    async execute(command: TestCommand, suffix: string): Promise<TestResult> {
      if (this.error) {
        throw this.error;
      }

      return { id: command.entityId, label: `${this.prefix}${suffix}` };
    }
  }

  return new TestHandler();
}

function explore(
  handler: ReturnType<typeof createHandler>,
  recorder: AuditRecorder,
): void {
  const discoveryService = {
    getProviders: jest.fn(() => [
      { instance: handler, name: 'TestHandler', token: handler.constructor },
      {
        instance: recorder,
        name: 'AuditRecorder',
        token: AUDIT_RECORDER_DI_TOKEN,
      },
    ]),
  } as unknown as DiscoveryService;
  const metadataScanner = {
    getAllMethodNames: jest.fn(() => ['execute']),
  } as unknown as MetadataScanner;
  const moduleRef = {
    get: jest.fn(() => recorder),
  } as unknown as ModuleRef;

  new AuditExplorer(
    discoveryService,
    metadataScanner,
    moduleRef,
  ).onModuleInit();
}

describe('AuditExplorer', () => {
  const command: TestCommand = {
    actorId: 'admin-id',
    entityId: 'user-id',
    lockReason: 'Policy violation',
  };
  const result: TestResult = { id: 'user-id', label: 'handled:suffix' };

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('records one resolved entry after success, preserving this and all arguments', async () => {
    const handler = createHandler();
    const recorder = {
      record: jest.fn<Promise<void>, Parameters<AuditRecorder['record']>>(),
    };
    explore(handler, recorder);

    await expect(handler.execute(command, 'suffix')).resolves.toEqual(result);

    expect(recorder.record).toHaveBeenCalledTimes(1);
    expect(recorder.record).toHaveBeenCalledWith({
      action: 'user.locked',
      entityType: 'user',
      entityId: 'user-id',
      actorId: 'admin-id',
      metadata: { lockReason: 'Policy violation', label: 'handled:suffix' },
    });
    expect(recorder.record.mock.calls[0]).toHaveLength(1);
  });

  it('preserves the original handler error without recording', async () => {
    const handler = createHandler();
    const error = new Error('Command failed');
    handler.error = error;
    const recorder = {
      record: jest.fn<Promise<void>, Parameters<AuditRecorder['record']>>(),
    };
    explore(handler, recorder);

    await expect(handler.execute(command, 'suffix')).rejects.toBe(error);
    expect(recorder.record).not.toHaveBeenCalled();
  });

  it('does not record when skipIf returns true', async () => {
    const skipIf = jest.fn(() => true);
    const handler = createHandler({ skipIf });
    const recorder = {
      record: jest.fn<Promise<void>, Parameters<AuditRecorder['record']>>(),
    };
    explore(handler, recorder);

    await expect(handler.execute(command, 'suffix')).resolves.toEqual(result);
    expect(skipIf).toHaveBeenCalledWith(command, result);
    expect(recorder.record).not.toHaveBeenCalled();
  });

  it('logs a recorder error once and returns the result with default onError', async () => {
    const handler = createHandler();
    const error = new Error('Recording failed');
    const recorder = {
      record: jest
        .fn<Promise<void>, Parameters<AuditRecorder['record']>>()
        .mockRejectedValue(error),
    };
    const loggerError = jest.spyOn(Logger.prototype, 'error');
    explore(handler, recorder);

    await expect(handler.execute(command, 'suffix')).resolves.toEqual(result);
    expect(loggerError).toHaveBeenCalledTimes(1);
    expect(loggerError).toHaveBeenCalledWith(
      expect.stringContaining('action=user.locked entityId=user-id'),
      error.stack,
    );
  });

  it('throws the recorder error when onError is throw', async () => {
    const handler = createHandler({ onError: 'throw' });
    const error = new Error('Recording failed');
    const recorder = {
      record: jest
        .fn<Promise<void>, Parameters<AuditRecorder['record']>>()
        .mockRejectedValue(error),
    };
    explore(handler, recorder);

    await expect(handler.execute(command, 'suffix')).rejects.toBe(error);
  });
});
