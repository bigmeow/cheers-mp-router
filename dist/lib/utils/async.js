"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runQueue = void 0;
function runQueue(queue, fn, cb) {
    const step = (index) => {
        if (index >= queue.length) {
            cb();
        }
        else {
            if (queue[index]) {
                fn(queue[index], () => {
                    step(index + 1);
                });
            }
            else {
                step(index + 1);
            }
        }
    };
    step(0);
}
exports.runQueue = runQueue;
//# sourceMappingURL=async.js.map