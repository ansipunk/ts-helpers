# Deno and TypeScript helpers

Things I have to write over and over in various TypeScript and Deno projects
that do not deserve their own repos, let alone packages. The proper way to use
the code in this repo is to copy and paste. Tests are written so I don't have to
manually test things and can know that further editing will not break things.

## Included stuff

### Async lock

Self explanatory. Usage can be seen in KV Model section.

### Deno KV models

Tiny helpers that help me write `usersModel.get(1337)` instead of
`kv.get(["app", "users", 1337])`. Prevents me from making dumb mistakes, reduces
duplication and de-uglifies code.

It has a very naive in-memory cache to avoid unnecessary latency. Won't work if
the same KV instance is accessed by multiple workers. Good solution would be to
remove it entirely, but it's just what I need for my personal needs. I should
make it opt-in.

#### Methods:

- `get` - returns just the value or null if it didn't exist. Doesn't return the
  rest of the metadata;
- `set` - accepts just the key and the value. Doesn't support TTL;
- `del` - duh;
- `all` - an asynchronous generator that yields all the values (but not the
  keys). Now that I think of that, it's really dumb, should be fixed soon.
- `drop` - deletes everything with that model's prefix. If you initialized it
  without a prefix, it will just delete everything.

#### ACID transactions

Due to its nature, Deno KV does not really support ACID transactions in the way
you might be used to. Best you can do is tell Deno KV cancel an outgoing write
if some of the provided keys with their values and timestamps have changed. It
doesn't isolate a transaction, instead aborting on race conditions. I tried
fiddling around with incorporating that async lock into the model, but it wasn't
worth it. You shouldn't attempt that too. But should you _really_ need that, you
can do the following:

```typescript
const model = new Model(kv, ["prefix"]);
const lock = new AsyncLock();

const tx1 = () =>
  lock.acquire(async () => {
    await model.set("key", "value");
    await model.get("key");
  });

const tx2 = () =>
  lock.acquire(async () => {
    await model.del("key");
  });

await Promise.all([tx1(), tx2()]);
```

Trust me, this is much better than implementing a `transaction()` for the Model.

#### TODO

- `all` method is really dumb;
- make cache opt-in.
