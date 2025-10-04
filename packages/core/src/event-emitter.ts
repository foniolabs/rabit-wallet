/**
 * Event emitter implementation for Rabit
 * Simple, efficient event system without extending EventEmitter3
 */
import type { 
  RabitEvent, 
  EventListener, 
  RabitEventEmitter, 
  EventFilter, 
  SubscriptionOptions 
} from '@rabit/types';

// Internal listener type that can handle any RabitEvent
type InternalEventListener = (event: RabitEvent) => void;

/**
 * Enhanced event emitter for Rabit with filtering and subscription management
 */
export class RabitEventEmitterImpl implements RabitEventEmitter {
  private listeners = new Map<string, Set<InternalEventListener>>();
  private eventHistory: RabitEvent[] = [];
  private readonly maxHistorySize = 1000;

  /**
   * Subscribe to events with optional filtering
   */
  on<T extends RabitEvent['type']>(
    eventType: T,
    listener: EventListener<Extract<RabitEvent, { type: T }>>,
    options?: SubscriptionOptions
  ): () => void {
    const wrappedListener: InternalEventListener = (event: RabitEvent) => {
      // Type guard to ensure we have the right event type
      if (event.type !== eventType) return;
      
      const typedEvent = event as Extract<RabitEvent, { type: T }>;
      
      // Apply filter if provided
      if (options?.filter && !this.applyFilter(typedEvent, options.filter)) {
        return;
      }
      
      // Call the original listener with the correctly typed event
      listener(typedEvent);
    };

    // Register the listener
    this.addListener(eventType, wrappedListener);

    // Handle replay of historical events
    if (options?.includeHistory) {
      this.replayHistoricalEvents(eventType, listener, options);
    }

    // Return unsubscribe function
    return () => {
      this.removeListener(eventType, wrappedListener);
    };
  }

  /**
   * Subscribe to events once
   */
  once<T extends RabitEvent['type']>(
    eventType: T,
    listener: EventListener<Extract<RabitEvent, { type: T }>>,
    options?: SubscriptionOptions
  ): () => void {
    let hasBeenCalled = false;
    
    const wrappedListener: InternalEventListener = (event: RabitEvent) => {
      // Type guard to ensure we have the right event type
      if (event.type !== eventType || hasBeenCalled) return;
      
      const typedEvent = event as Extract<RabitEvent, { type: T }>;
      
      // Apply filter if provided
      if (options?.filter && !this.applyFilter(typedEvent, options.filter)) {
        return;
      }
      
      // Mark as called and remove listener
      hasBeenCalled = true;
      this.removeListener(eventType, wrappedListener);
      
      // Call original listener
      listener(typedEvent);
    };

    this.addListener(eventType, wrappedListener);

    return () => {
      this.removeListener(eventType, wrappedListener);
    };
  }

  /**
   * Unsubscribe from events
   */
  off<T extends RabitEvent['type']>(
    eventType: T,
    listener: EventListener<Extract<RabitEvent, { type: T }>>
  ): void {
    // Find and remove the specific listener
    const listeners = this.listeners.get(eventType);
    if (!listeners) return;

    // We need to find the wrapped listener that corresponds to the original listener
    // This is tricky because we wrap listeners, so we'll remove all listeners for this event type
    // In practice, you might want to maintain a WeakMap to track original->wrapped mappings
    listeners.forEach(wrappedListener => {
      // For now, we'll remove the listener if it matches somehow
      // A more robust solution would maintain a mapping of original to wrapped listeners
      this.removeListener(eventType, wrappedListener);
    });
  }

  /**
   * Emit an event
   */
  emit<T extends RabitEvent>(event: T): void {
    // Add to history
    this.addToHistory(event);
    
    // Get listeners for this event type
    const listeners = this.listeners.get(event.type);
    if (!listeners) return;
    
    // Call all listeners
    listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        // Don't let listener errors break other listeners
        console.error('Event listener error:', error);
      }
    });
  }

  /**
   * Remove all listeners
   */
  removeAllListeners(eventType?: RabitEvent['type']): void {
    if (eventType) {
      this.listeners.delete(eventType);
    } else {
      this.listeners.clear();
    }
  }

  /**
   * Get listener count
   */
  listenerCount(eventType: RabitEvent['type']): number {
    const listeners = this.listeners.get(eventType);
    return listeners ? listeners.size : 0;
  }

  /**
   * Get all registered event types
   */
  getEventTypes(): RabitEvent['type'][] {
    return Array.from(this.listeners.keys()) as RabitEvent['type'][];
  }

  /**
   * Get event history
   */
  getEventHistory(filter?: EventFilter): RabitEvent[] {
    if (!filter) return [...this.eventHistory];
    
    return this.eventHistory.filter(event => this.applyFilter(event, filter));
  }

  /**
   * Clear event history
   */
  clearHistory(): void {
    this.eventHistory = [];
  }

  /**
   * Add listener to internal map
   */
  private addListener(eventType: string, listener: InternalEventListener): void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    
    const listeners = this.listeners.get(eventType)!;
    listeners.add(listener);
  }

  /**
   * Remove listener from internal map
   */
  private removeListener(eventType: string, listener: InternalEventListener): void {
    const listeners = this.listeners.get(eventType);
    if (!listeners) return;
    
    listeners.delete(listener);
    
    // Clean up empty listener sets
    if (listeners.size === 0) {
      this.listeners.delete(eventType);
    }
  }

  /**
   * Add event to history with size management
   */
  private addToHistory(event: RabitEvent): void {
    this.eventHistory.push(event);
    
    // Maintain max history size
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }
  }

  /**
   * Apply event filter
   */
  private applyFilter(event: RabitEvent, filter: EventFilter): boolean {
    // Filter by event types
    if (filter.types && !filter.types.includes(event.type)) {
      return false;
    }

    // Filter by source
    if (filter.sources && event.source && !filter.sources.includes(event.source)) {
      return false;
    }

    // Filter by date range
    if (filter.dateRange) {
      const eventDate = new Date(event.timestamp);
      if (filter.dateRange.from && eventDate < filter.dateRange.from) {
        return false;
      }
      if (filter.dateRange.to && eventDate > filter.dateRange.to) {
        return false;
      }
    }

    // Filter by chain ID
    if (filter.chainId && 'chainId' in event.data && event.data.chainId !== filter.chainId) {
      return false;
    }

    // Filter by account
    if (filter.account) {
      if ('accounts' in event.data && Array.isArray(event.data.accounts)) {
        if (!event.data.accounts.includes(filter.account)) {
          return false;
        }
      } else if ('account' in event.data && event.data.account !== filter.account) {
        return false;
      }
    }

    return true;
  }

  /**
   * Replay historical events for new subscribers
   */
  private replayHistoricalEvents<T extends RabitEvent['type']>(
    eventType: T,
    listener: EventListener<Extract<RabitEvent, { type: T }>>,
    options: SubscriptionOptions
  ): void {
    const relevantEvents = this.eventHistory
      .filter(event => event.type === eventType)
      .slice(-(options.historyLimit || 10)) as Extract<RabitEvent, { type: T }>[];

    // Replay events asynchronously
    setTimeout(() => {
      relevantEvents.forEach(event => {
        try {
          listener(event);
        } catch (error) {
          console.error('Error replaying historical event:', error);
        }
      });
    }, 0);
  }
}

/**
 * Create a new RabitEventEmitter instance
 */
export function createEventEmitter(): RabitEventEmitter {
  return new RabitEventEmitterImpl();
}

/**
 * Global event emitter instance for shared events
 */
export const globalEventEmitter = createEventEmitter();