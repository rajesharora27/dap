import { EventEmitter } from 'events';

/** A minimal in-memory PubSub supporting multiple events per subscription. */
class SimplePubSub {
  private ee = new EventEmitter();

  publish(trigger: string, payload: any) {
    this.ee.emit(trigger, payload);
  }

  asyncIterator<T = any>(trigger: string): AsyncIterable<T> {
    const ee = this.ee;
    const listeners = new Set<(...args: any[]) => void>();
    const queue: T[] = [];
    let pullResolve: ((value: IteratorResult<T>) => void) | null = null;
    let listening = true;

    const pushValue = (val: T) => {
      if (pullResolve) {
        pullResolve({ value: val, done: false });
        pullResolve = null;
      } else {
        queue.push(val);
      }
    };

    const addListener = () => {
      const handler = (payload: T) => pushValue(payload);
      ee.on(trigger, handler);
      listeners.add(handler);
    };
    addListener();

    const empty = async (): Promise<IteratorResult<T>> => new Promise(resolve => { pullResolve = resolve; });

    return {
      [Symbol.asyncIterator]() {
        return {
          next: (): Promise<IteratorResult<T>> => {
            if (!listening) return Promise.resolve({ value: undefined as any, done: true });
            if (queue.length) {
              return Promise.resolve({ value: queue.shift() as T, done: false });
            }
            return empty();
          },
          return: () => {
            listening = false;
            listeners.forEach(l => ee.removeListener(trigger, l));
            queue.length = 0;
            return Promise.resolve({ value: undefined as any, done: true });
          },
          throw: (error: any) => {
            listening = false;
            listeners.forEach(l => ee.removeListener(trigger, l));
            return Promise.reject(error);
          }
        };
      }
    } as AsyncIterable<T>;
  }
}

export const pubsub = new SimplePubSub();

export const PUBSUB_EVENTS = {
  PRODUCT_UPDATED: 'PRODUCT_UPDATED',
  TASK_UPDATED: 'TASK_UPDATED'
};
