import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import type { ConfirmChannel, ConsumeMessage, Options } from 'amqplib';
import {
  IMessageBrokerPublisher,
  PublishOptions,
} from 'shared/application/messaging/message-broker.publisher';
import { IntegrationEvent } from 'shared/application/messaging/integration-event';
import { ApiConfigService } from 'shared/services/api-config.service';

@Injectable()
export class RabbitmqPublisher
  implements IMessageBrokerPublisher, OnModuleInit
{
  private readonly logger = new Logger(RabbitmqPublisher.name);
  private readonly returnedMessageIds = new Set<string>();
  private returnListenerRegistered = false;
  private readonly exchange: string;

  constructor(
    private readonly amqp: AmqpConnection,
    config: ApiConfigService,
  ) {
    this.exchange = config.rabbitMqConfig.exchange;
  }

  onModuleInit(): void {
    this.registerReturnListener();
  }

  async publishWithConfirm(
    event: IntegrationEvent,
    options: PublishOptions = {},
  ): Promise<void> {
    this.registerReturnListener();

    const publishOptions: Options.Publish & { timeout?: number } = {
      persistent: true,
      mandatory: true,
      messageId: event.id,
      correlationId: event.aggregateId,
      type: event.eventType,
      contentType: 'application/json',
      timestamp: Date.now(),
      headers: {
        'x-aggregate-id': event.aggregateId,
        'x-aggregate-type': event.aggregateType,
        ...event.headers,
      },
      timeout: options.timeoutMs,
    };

    try {
      const confirmed = await this.amqp.publish(
        this.exchange,
        event.routingKey,
        event,
        publishOptions,
      );

      if (!confirmed) {
        throw new Error(`Broker did not confirm message ${event.id}`);
      }

      if (this.returnedMessageIds.has(event.id)) {
        throw new Error(
          `Message ${event.id} was unroutable (no queue bound for "${event.routingKey}")`,
        );
      }
    } finally {
      this.returnedMessageIds.delete(event.id);
    }
  }

  private registerReturnListener(): void {
    if (this.returnListenerRegistered) return;
    const channel = this.amqp.managedChannel;
    if (!channel) return;
    this.returnListenerRegistered = true;

    channel
      .addSetup((confirmChannel: ConfirmChannel) => {
        confirmChannel.on('return', (message: ConsumeMessage) => {
          const messageId = message.properties.messageId as string | undefined;

          if (messageId) this.returnedMessageIds.add(messageId);
        });
      })
      .catch((error: unknown) =>
        this.logger.error(
          `Failed to register return listener: ${error instanceof Error ? error.message : String(error)}`,
        ),
      );
  }
}
