export class AsyncLock {
  private queue: (() => Promise<void>)[] = [];
  private isLocked = false;

  acquire<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const execute = async () => {
        try {
          this.isLocked = true;
          resolve(await fn());
        } catch (err) {
          reject(err);
        } finally {
          this.isLocked = false;
          if (this.queue.length > 0) {
            const next = this.queue.shift();
            if (next) void next();
          }
        }
      };

      if (this.isLocked) {
        this.queue.push(execute);
      } else {
        void execute();
      }
    });
  }
}
