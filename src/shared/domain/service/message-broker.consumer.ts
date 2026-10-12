export interface IMessageBrokerConsumer {
  subscribe<T>(
    topic: string,
    handler: (message: T) => Promise<void>,
  ): Promise<void>;
}
