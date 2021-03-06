# redis-manager

[![NPM version](https://badge.fury.io/js/redis-manager.png)](http://badge.fury.io/js/redis-manager) [![Dependency Status](https://gemnasium.com/uber/redis-manager.png)](https://gemnasium.com/uber/redis-manager) [![Build Status](https://travis-ci.org/uber/redis-manager.png?branch=master)](https://travis-ci.org/uber/redis-manager) [![Coverage Status](https://coveralls.io/repos/uber/redis-manager/badge.png)](https://coveralls.io/r/uber/redis-manager)

Simple library to share redis clients in a code base

## Install

    npm install redis-manager

## Usage

```js
var redisManager = require('redis-manager');
var client = redisManager.getClient(); // Same options as `redis.createClient`, is an instance of `redis`'s client, but the args can be specified in any order desired

client.set('key', 'val', callback);
// ...

// All done? Free the client so the manager can shut it down if no one is using it, anymore.
redisManager.freeClient(client);
```

### Pub/sub and select wrinkle

The Redis library, whenever a `subscribe` method is called, [puts the instance in a special mode that disables all other Redis commands](https://github.com/mranney/node_redis#publish--subscribe). Therefore this kind of redis connection cannot be pooled unless distinguished during configuration, so a `sub` property has been added to the `options` parameter when getting a client. If you need subscribe Redis usage, be sure to pass in this flag. (Currently works on the honor system.)

Further, whenever a `select` method is called, the semantics of `hset`/`hget`/etc change, and a common redis instance shared between code trying to read/write different databases is a Bad Thing(tm).

### Event Listener Corner Case

If two instances of redis-manager pointing at the same actual client register *the exact same listener* (``listenerA === listenerB``), when the first instance is freed, both registered listeners will be eliminated as it removes listeners created by the instance being freed. This is very unlikely to ever be the case as even identical code between two files wold be considered different functions (because of differing scope), but is possible.

## License (MIT)

Copyright (C) 2013 by Uber Technologies, Inc

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
