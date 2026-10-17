import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ApiConfigService } from 'shared/services/api-config.service';
import { RelayOutboxHandler } from '../../use-case/relay/relay-outbox.handler';

@Injectable()
export class OutboxRelayScheduler implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OutboxRelayScheduler.name);
  private timer?: NodeJS.Timeout;
  private inFlight?: Promise<void>;

  constructor(
    private readonly config: ApiConfigService,
    private readonly handler: RelayOutboxHandler,
  ) {}

  onModuleInit(): void {
    const { relayEnabled, relayIntervalMs } = this.config.outboxConfig;

    if (!relayEnabled) return;

    this.timer = setInterval(() => this.tick(), relayIntervalMs);

    this.tick();
  }

  async onModuleDestroy(): Promise<void> {
    if (this.timer) clearInterval(this.timer);

    await this.inFlight;
  }

  private tick(): void {
    if (this.inFlight) return;
    this.inFlight = this.handler
      .execute()
      .catch((error: unknown) =>
        this.logger.error(
          error instanceof Error ? error.message : String(error),
        ),
      )
      .finally(() => {
        this.inFlight = undefined;
      });
  }
}
