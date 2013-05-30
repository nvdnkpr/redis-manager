var redisManager = require('../lib/redis-manager');

exports.sameClientIsSame = function(test) {
    test.expect(1);
    var client1 = redisManager.getClient();
    var client2 = redisManager.getClient();
    test.equal(client1, client2);
    redisManager.freeClient(client1);
    redisManager.freeClient(client2);
    test.done();
};

exports.differentClientIsDifferent = function(test) {
    test.expect(1);
    var client1 = redisManager.getClient();
    var client2 = redisManager.getClient(6379, 'localhost');
    test.notEqual(client1, client2);
    redisManager.freeClient(client1);
    redisManager.freeClient(client2);
    test.done();
};

exports.freeClients = function(test) {
    test.expect(4);
    var client = redisManager.getClient();
    test.equal(true, redisManager.freeClient(client));
    test.equal(false, redisManager.freeClient(client));
    var client1 = redisManager.getClient();
    var client2 = redisManager.getClient();
    test.equal(true, redisManager.freeClient(client1));
    test.equal(true, redisManager.freeClient(client2));
    test.done();
};
