var redis = require('redis');

var uniqueRedises = {};
var redisRefs = {};

function redisId(host, port, options) {
    return host + port + JSON.stringify(options);
}

function reverseLookup(client) {
    var ids = Object.keys(uniqueRedises);
    for(var i = 0; i < ids.length; i++) {
        if(uniqueRedises[ids[i]] === client) return ids[i];
    }
    return null;
}

function getClient(host, port, options) {
    var id = redisId(host, port, options);
    if(!uniqueRedises[id]) {
        uniqueRedises[id] = redis.createClient(host, port, options);
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
