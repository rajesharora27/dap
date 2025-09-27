"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PUBSUB_EVENTS = exports.pubsub = void 0;
const events_1 = require("events");
/** A minimal in-memory PubSub supporting multiple events per subscription. */
class SimplePubSub {
    ee = new events_1.EventEmitter();
    publish(trigger, payload) {
        this.ee.emit(trigger, payload);
    }
    asyncIterator(trigger) {
        const ee = this.ee;
        const listeners = new Set();
        const queue = [];
        let pullResolve = null;
        let listening = true;
        const pushValue = (val) => {
            if (pullResolve) {
                pullResolve({ value: val, done: false });
                pullResolve = null;
            }
            else {
                queue.push(val);
            }
        };
        const addListener = () => {
            const handler = (payload) => pushValue(payload);
            ee.on(trigger, handler);
            listeners.add(handler);
        };
        addListener();
        const empty = async () => new Promise(resolve => { pullResolve = resolve; });
        return {
            [Symbol.asyncIterator]() {
                return {
                    next: () => {
                        if (!listening)
                            return Promise.resolve({ value: undefined, done: true });
                        if (queue.length) {
                            return Promise.resolve({ value: queue.shift(), done: false });
                        }
                        return empty();
                    },
                    return: () => {
                        listening = false;
                        listeners.forEach(l => ee.removeListener(trigger, l));
                        queue.length = 0;
                        return Promise.resolve({ value: undefined, done: true });
                    },
                    throw: (error) => {
                        listening = false;
                        listeners.forEach(l => ee.removeListener(trigger, l));
                        return Promise.reject(error);
                    }
                };
            }
        };
    }
}
exports.pubsub = new SimplePubSub();
exports.PUBSUB_EVENTS = {
    PRODUCT_UPDATED: 'PRODUCT_UPDATED',
    TASK_UPDATED: 'TASK_UPDATED'
};
