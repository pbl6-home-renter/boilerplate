export interface RabbitMqConfig {
  url: string;
  exchange: string;
  exchangeType: string;
  prefetch: number;
  connectTimeoutMs: number;
  /** Total deliveries (first included) before a consumer moves a message to its DLQ. */
  consumerMaxAttempts: number;
  /** Delay a failed message spends in `<queue>.retry` before it is redelivered. */
  consumerRetryDelayMs: number;
}
