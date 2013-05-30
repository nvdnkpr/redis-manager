var redis = require('redis');

var uniqueRedises = {};
var redisRefs = {};

function redisId(port, host, options) {
    return host + port + JSON.stringify(options);
}

function reverseLookup(client) {
    var ids = Object.keys(uniqueRedises);
    for(var i = 0; i < ids.length; i++) {
        if(uniqueRedises[ids[i]] === client) return ids[i];
    }
    return null;
}

function getClient(port, host, options) {
    var id = redisId(port, host, options);
    if(!uniqueRedises[id]) {
        uniqueRedises[id] = redis.createClient(port, host, options);
        redisRefs[id] = 0;
    }
    redisRefs[id]++;
    return uniqueRedises[id];
}

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

module.exports = {
    getClient: getClient,
    freeClient: freeClient
};
