import { assertEquals } from "@std/assert";

import { Model } from "../src/model.ts";

const kv = await Deno.openKv();

Deno.test("Model: key buidling", async () => {
  const prefix = ["test", "key", "building"];
  const key = ["my", "key"];
  const value = 12345;

  const model = new Model(kv, prefix);
  await model.set(key, value);

  const item = await kv.get([...prefix, ...key]);
  assertEquals(item.value, value);

  await model.del(key);
});

Deno.test("Model: get/set item", async () => {
  const key = ["my", "key"];
  const value = 1337;

  const model = new Model(kv, ["test", "get", "item"]);
  await model.set(key, value);
  assertEquals(value, await model.get(key));

  await model.del(key);
});

Deno.test("Model: del item", async () => {
  const key = ["my", "key"];
  const value = 1337;

  const model = new Model(kv, ["test", "del", "item"]);
  await model.set(key, value);
  assertEquals(await model.get(key), value);

  await model.del(key);
  assertEquals(await model.get(key), null);
});

Deno.test("Model: all items", async () => {
  const model: Model<number, number> = new Model(kv, [
    "test",
    "all",
    "items",
  ]);
  const targetCount = 10;

  for (let i = 0; i < targetCount; i++) {
    await model.set(i, i);
  }

  let itemCount = 0;
  for await (const item of model.all()) {
    assertEquals(item, await model.get(item));
    itemCount++;
  }
  assertEquals(itemCount, targetCount);

  await model.drop();
});

Deno.test("Model: drop", async () => {
  const model: Model<string, string> = new Model(kv, ["test", "drop"]);
  await model.set("key", "value");

  await model.drop();

  const item = await model.get("key");
  assertEquals(item, null);
});
