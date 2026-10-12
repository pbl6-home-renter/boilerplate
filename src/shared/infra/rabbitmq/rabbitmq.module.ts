import { Module } from '@nestjs/common';
import { RabbitmqRepository } from './rabbitmq.repository';

@Module({
  providers: [RabbitmqRepository],
  exports: [RabbitmqRepository],
})
export class RabbitmqModule {}
