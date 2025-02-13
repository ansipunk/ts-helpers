import { assertEquals } from "@std/assert";

import { AsyncLock } from "../src/lock.ts";

Deno.test("Lock: sequential execution", async () => {
  const lock = new AsyncLock();
  const executionOrder: number[] = [];

  async function task(id: number) {
    await lock.acquire(async () => {
      executionOrder.push(id);
      await new Promise((res) => setTimeout(res, 5));
    });
  }

  await Promise.all([task(1), task(2), task(3)]);
  assertEquals(executionOrder, [1, 2, 3]);
});

Deno.test("Lock: sequential dependency", async () => {
  const lock = new AsyncLock();
  let sharedValue = 0;

  async function firstTask() {
    await lock.acquire(async () => {
      sharedValue = 1;
      await new Promise((res) => setTimeout(res, 10));
      sharedValue = 3;
    });
  }

  async function secondTask() {
    await lock.acquire(async () => {
      await new Promise((res) => setTimeout(res, 5));
      sharedValue *= 2;
    });
  }

  await Promise.all([firstTask(), secondTask()]);
  assertEquals(sharedValue, 6);
});
