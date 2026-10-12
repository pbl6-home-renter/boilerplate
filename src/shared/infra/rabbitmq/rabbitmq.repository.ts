import { Injectable, Logger } from '@nestjs/common';
import {
  ClientProxy,
  ClientProxyFactory,
  Transport,
} from '@nestjs/microservices';
import { IMessageBrokerConsumer } from 'shared/domain/service/message-broker.consumer';
import { ApiConfigService } from 'shared/services/api-config.service';

@Injectable()
export class RabbitmqRepository implements IMessageBrokerConsumer {
  private readonly logger = new Logger(RabbitmqRepository.name);
  private client: ClientProxy;

  constructor(private readonly configService: ApiConfigService) {
    this.client = ClientProxyFactory.create({
      transport: Transport.RMQ,
      options: {
        urls: [this.configService.rabbitMqUrl],
        queue: this.configService.appName,
        queueOptions: {
          durable: false,
        },
      },
    });
  }

  async subscribe(pattern: string): Promise<void> {
    this.logger.log(`Subscribing to pattern: ${pattern}`);

    this.client
      .connect()
      .then(() => {
        this.logger.log(`Connected to RabbitMQ for pattern: ${pattern}`);
      })
      .catch((error) => {
        this.logger.error(`Failed to connect to RabbitMQ: ${error.message}`);
      });
  }

  async publish<T>(pattern: string, data: T): Promise<void> {
    this.logger.log(`Publishing message to pattern: ${pattern}`);

    try {
      await this.client.emit(pattern, data).toPromise();
      this.logger.log(`Message published successfully to pattern: ${pattern}`);
    } catch (error) {
      this.logger.error(`Failed to publish message`);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.client.close();
  }
}
