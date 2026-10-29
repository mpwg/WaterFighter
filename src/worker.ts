import type { Request } from './protocol';
import { Controller } from './simulation/controller';
const controller = new Controller((message, transfer) => self.postMessage(message, { transfer }));
self.onmessage = (event: MessageEvent<Request>) => controller.handle(event.data);
setInterval(() => controller.tick(performance.now()), 50);
