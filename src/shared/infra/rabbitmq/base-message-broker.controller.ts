import { Controller } from '@nestjs/common';
import { RmqContext } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';

@Controller()
export abstract class BaseMessageBrokerController {
  protected abstract readonly logger: Logger;
  protected abstract handleMessage(data: any): Promise<void>;

  protected acknowledgeMessage(context: RmqContext): void {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    channel.ack(originalMsg);
  }

  protected rejectMessage(context: RmqContext, requeue: boolean = false): void {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    channel.nack(originalMsg, false, requeue);
  }

  protected logMessageInfo(context: RmqContext): void {
    const pattern = context.getPattern();
    const channel = context.getChannelRef();
    this.logger.log(
      `Received message with pattern: ${pattern} on channel: ${channel.connection.stream.localAddress}`,
    );
  }
}
