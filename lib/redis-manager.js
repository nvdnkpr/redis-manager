/* jshint camelcase: false */
var redis = require('redis');

// Hash tables to store references to unique redis clients and how many references there are to them
var uniqueRedises = {};
var redisRefs = {};

// Calculate a unique ID for each redis client type, based on the redis server to connect to and what options to use
function redisId(port, host, options) {
    return "" + host + port + JSON.stringify(options);
}

// Return the client's ID, if it exists
function reverseLookup(client) {
    return client.__id__ && uniqueRedises[client.__id__] ? client.__id__ : null;
}

// Request for either a new or existing client and increment the reference count
function getClient(port, host, options) {
    var id = redisId(port, host, options);
    if(!uniqueRedises[id]) {
        // Flag pub/sub connections as 'different' [because you have to have another connection for regular Redis commands](https://github.com/mranney/node_redis#publish--subscribe)
        // But don't pass this parameter down to the library
        if(options && options.pubsub) delete options.pubsub;
        uniqueRedises[id] = redis.createClient(port, host, options);
        uniqueRedises[id].__id__ = id;
        redisRefs[id] = 0;
    }
    redisRefs[id]++;
    return uniqueRedises[id];
}

// Inform redis-manager that this client is no longer needed; welcome back to C-land!
function freeClient(client) {
    var id = reverseLookup(client);
    if(!id) return false; // Should we throw an error here?
    redisRefs[id]--;
    if(redisRefs[id] === 0) {
        client.quit();
        delete redisRefs[id];
        delete uniqueRedises[id];
    }
    return true;
}

// Public API
module.exports = {
    getClient: getClient,
    freeClient: freeClient
};
