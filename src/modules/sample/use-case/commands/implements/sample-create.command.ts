import { ICommand } from '@nestjs/cqrs';

export class CreateSampleCommand implements ICommand {
  constructor(
    public readonly title: string,
    public readonly description?: string,
  ) {}
}
