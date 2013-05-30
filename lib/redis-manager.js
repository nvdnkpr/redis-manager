var redis = require('redis');

// Hash tables to store references to unique redis clients and how many references there are to them
var uniqueRedises = {};
var redisRefs = {};

// Calculate a unique ID for each redis client type, based on the redis server to connect to and what options to use
function redisId(port, host, options) {
    return host + port + JSON.stringify(options);
}

// For a given client, find it's ID; currently iterates through all clients until a match is found, may work on a reverse-lookup table in the future
function reverseLookup(client) {
    var ids = Object.keys(uniqueRedises);
    for(var i = 0; i < ids.length; i++) {
        if(uniqueRedises[ids[i]] === client) return ids[i];
    }
    return null;
}

// Request for either a new or existing client and increment the reference count
function getClient(port, host, options) {
    var id = redisId(port, host, options);
    if(!uniqueRedises[id]) {
        uniqueRedises[id] = redis.createClient(port, host, options);
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
