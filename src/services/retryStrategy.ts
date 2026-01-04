export interface RetryConfig {
  maxRetries: number
  initialDelayMs: number
  maxDelayMs: number
  backoffMultiplier: number
  jitter: boolean
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 5,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
  jitter: true,
}

export class RetryStrategy {
  constructor(private config: RetryConfig = DEFAULT_RETRY_CONFIG) {}

  calculateDelay(retryCount: number): number {
    let delay = Math.min(
      this.config.initialDelayMs * Math.pow(this.config.backoffMultiplier, retryCount),
      this.config.maxDelayMs,
    )

    if (this.config.jitter) {
      // Add jitter: 0-25% randomization
      const jitterAmount = delay * 0.25
      delay += Math.random() * jitterAmount
    }

    return Math.round(delay)
  }

  shouldRetry(retryCount: number): boolean {
    return retryCount < this.config.maxRetries
  }

  getNextDelay(retryCount: number): number | null {
    if (!this.shouldRetry(retryCount)) {
      return null
    }
    return this.calculateDelay(retryCount)
  }
}

export async function executeWithRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
  onRetry?: (attempt: number, delay: number, error: Error) => void,
): Promise<T> {
  const strategy = new RetryStrategy(config)
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn()
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e))

      if (!strategy.shouldRetry(attempt)) {
        throw lastError
      }

      const delay = strategy.calculateDelay(attempt)
      onRetry?.(attempt + 1, delay, lastError)
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  throw lastError || new Error('Unknown error')
}
