var redis = require('redis');
var binders = require('binders');

// Hash tables to store references to unique redis clients and how many references there are to them
var uniqueRedises = {};
var redisRefs = {};
var redisEvents = {};

// Calculate a unique ID for each redis client type, based on the redis server to connect to and what options to use
function redisId(port, host, options) {
    return "" + host + port + JSON.stringify(options);
}

// Return the client's ID, if it exists
function reverseLookup(client) {
    return client && client.__id__ && uniqueRedises[client.__id__] ? client.__id__ : null;
}

// Wrap the client's ``on`` and ``once`` EventEmitter methods to make sure we automatically remove no-longer-needed event handlers
function wrapEventEmitter(client, id) {
    redisEvents[id] = redisEvents[id] || [];
    var count = redisEvents[id].length;
    redisEvents[id][count] = { on: [], once: [] };
    var redisEventsObj = redisEvents[id][count];
    client.on = function fakeOn(event, listener) {
        redisEventsObj.on.push([event, listener]);
        client._on(event, listener);
    };
    client.addListener = client.on;
    client.once = function fakeOnce(event, listener) {
        redisEventsObj.once.push([event, listener]);
        client._once(event, listener);
    };
    client.removeListener = function fakeRemoveListener(event, listener) {
        redisEventsObj.on = redisEventsObj.on.filter(function(arr) {
            if(arr[0] === event && arr[1] === listener) return false;
            return true;
        });
        redisEventsObj.once = redisEventsObj.once.filter(function(arr) {
            if(arr[0] === event && arr[1] === listener) return false;
            return true;
        });
        client._removeListener(event, listener);
    };
    client.removeAllListeners = function fakeRemoveAllListeners(event) {
        if(event) {
            redisEventsObj.on.filter(function(arr) {
                if(arr[0] === event) return true;
                return false;
            }).forEach(function(arr) {
                client._removeListener(event, arr[1]);
            });
            redisEventsObj.on = [];
            redisEventsObj.once.filter(function(arr) {
                if(arr[0] === event) return true;
                return false;
            }).forEach(function(arr) {
                client._removeListener(event, arr[1]);
            });
            redisEventsObj.once = [];
        } else {
            redisEventsObj.on.forEach(function(arr) {
                client._removeListener(arr[0], arr[1]);
            });
            redisEventsObj.on = [];
            redisEventsObj.once.forEach(function(arr) {
                client._removeListener(arr[0], arr[1]);
            });
            redisEventsObj.once = [];
        }
    };
}


// Request for either a new or existing client and increment the reference count
function getClient() {
    var port, host, options;
    for(var i = 0; i < arguments.length; i++) {
        if(typeof arguments[i] === 'string') {
            host = arguments[i];
        } else if(typeof arguments[i] === 'number') {
            port = arguments[i];
        } else if(typeof arguments[i] === 'object') {
            options = arguments[i];
        }
    }
   
    var id = redisId(port, host, options);
    if(!uniqueRedises[id]) {
        // Flag subscribe connections as 'different' [because you have to have another connection for regular Redis commands](https://github.com/mranney/node_redis#publish--subscribe)
        // but don't pass this parameter down to the library. Also make select calls part of the getClient step as that affects the semantics of the client instance
        if(options && options.sub) delete options.sub;
        var selectDB = options && options.select ? options.select : undefined;
        if(selectDB) delete options.select;
        uniqueRedises[id] = redis.createClient(port, host, options);
        uniqueRedises[id].__id__ = id;
        redisRefs[id] = 0;
        if(selectDB) uniqueRedises[id].select(selectDB);
    }
    redisRefs[id]++;

    // Binders creates a new object built with methods bound to the original object, so we can alter it at will.
    var outRedis = binders(uniqueRedises[id]);
    outRedis.__id__ = id;

    // Inform users of redis-manager that they shouldn't close the clients directly
    outRedis._quit = outRedis.quit;
    outRedis._end = outRedis.end;
    outRedis.quit = function throwWarning() {
        throw new Error('redis-manager handles client shutdown, now. Use redisManager.freeClient(client) instead.');
    };
    outRedis.end = outRedis.quit;

    // EventEmitter calls are wrapped so when a particular client instance is freed, its event handlers are removed (but not any other instance of the same client's events)
    outRedis._on = outRedis.on;
    outRedis._once = outRedis.once;
    outRedis._removeListener = outRedis.removeListener;
    outRedis._removeAllListeners = outRedis.removeAllListeners;
    wrapEventEmitter(outRedis, id);

    return outRedis;
}

// Inform redis-manager that this client is no longer needed; welcome back to C-land!
function freeClient(client) {
    var id = reverseLookup(client);
    if(!id) return false; // Should we throw an error here?
    redisRefs[id]--;
    client.removeAllListeners();
    if(redisRefs[id] === 0) {
        client._quit();
        delete redisRefs[id];
        delete uniqueRedises[id];
    }
    return true;
}

// Public API
module.exports = {
    getClient: getClient,
    freeClient: freeClient,
    redis: redis // For interfacing with redis-lua
};
