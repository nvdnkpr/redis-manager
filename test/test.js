var jscoverage = require('jscoverage');
jscoverage.enableCoverage(true);
var coveralls = require('coveralls');
var redisManager = jscoverage.require(module, '../lib/redis-manager');

exports.sameClientIsSame = function(test) {
    test.expect(1);
    var client1 = redisManager.getClient();
    var client2 = redisManager.getClient();
    test.equal(client1.__id__, client2.__id__);
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

exports.sub = function(test) {
    test.expect(1);
    var client1 = redisManager.getClient(6379, 'localhost');
    var client2 = redisManager.getClient(6379, 'localhost', { sub: true });
    test.notEqual(client1, client2);
    redisManager.freeClient(client1);
    redisManager.freeClient(client2);
    test.done();
};

exports.select = function(test) {
    test.expect(1);
    var client1 = redisManager.getClient(6379, 'localhost');
    var client2 = redisManager.getClient(6379, 'localhost', { select: 1 });
    test.notEqual(client1, client2);
    redisManager.freeClient(client1);
    redisManager.freeClient(client2);
    test.done();
};

exports.outOfOrderArgs = function(test) {
    test.expect(1);
    var client1 = redisManager.getClient(6379, 'localhost');
    var client2 = redisManager.getClient('localhost', 6379);
    test.equal(client1.__id__, client2.__id__);
    redisManager.freeClient(client1);
    redisManager.freeClient(client2);
    test.done();
};

exports.eventsProperlyFreed = function(test) {
    test.expect(2);
    var client1 = redisManager.getClient();
    var client2 = redisManager.getClient();
    client1.on('foo', function() {});
    client2.on('foo', function() {});
    test.equal(2, client1.listeners('foo').length, 'Both listeners attached to the same object');
    redisManager.freeClient(client1);
    test.equal(1, client2.listeners('foo').length, "Client1's listener was removed when the client was freed");
    redisManager.freeClient(client2);
    test.done();
};

exports.onceEventsProperlyFreed = function(test) {
    test.expect(2);
    var client1 = redisManager.getClient();
    var client2 = redisManager.getClient();
    client1.once('foo', function() {});
    client2.once('foo', function() {});
    test.equal(2, client1.listeners('foo').length, 'Both listeners attached to the same object');
    redisManager.freeClient(client1);
    test.equal(1, client2.listeners('foo').length, "Client1's listener was removed when the client was freed");
    redisManager.freeClient(client2);
    test.done();
};

exports.removeListeners = function(test) {
    test.expect(5);
    var client1 = redisManager.getClient();
    var client2 = redisManager.getClient();
    var client1Foo = function() {};
    var client1Foo2 = function() {};
    var client1Bar = function() {};
    var client2Foo = function() {};
    var client2Foo2 = function() {};
    var client2Bar = function() {};
    client1.on('foo', client1Foo);
    client1.on('foo', client1Foo2);
    client1.on('bar', client1Bar);
    client2.once('foo', client2Foo);
    client2.once('foo', client2Foo2);
    client2.once('bar', client2Bar);
    test.equal(4, client1.listeners('foo').length, 'All listeners attached to the same object');
    client1.removeListener('foo', client1Foo);
    test.equal(3, client1.listeners('foo').length, 'Listener removed correctly');
    client2.removeListener('foo', client2Foo);
    test.equal(2, client1.listeners('foo').length, 'Both listeners removed');
    client1.removeAllListeners('foo');
    test.equal(1, client1.listeners('foo').length, 'All client1 listeners removed');
    client2.removeAllListeners('foo');
    test.equal(0, client1.listeners('foo').length, 'All listeners removed');
    redisManager.freeClient(client1);
    redisManager.freeClient(client2);
    test.done();
};

exports.freeNothing = function(test) {
    test.expect(1);
    test.equal(redisManager.freeClient(undefined), false, "Doesn't crash redis-manager");
    test.done();
};

exports.tryToQuit = function(test) {
    test.expect(1);
    var client = redisManager.getClient();
    test.throws(function() {
        client.quit();
    });
    redisManager.freeClient(client);
    test.done();
};

exports.jscoverage = function(test) {
    test.expect(1);
    jscoverage.coverageDetail();
    // Copied directly from jscoverage and edited, since getting at these values directly isn't possible
    var file;
    var tmp;
    var total;
    var touched;
    var n, len;
    if (typeof global._$jscoverage === 'undefined') {
        return;
    }
    var lcov = "";
    Object.keys(global._$jscoverage).forEach(function(key) {
        file = key;
        lcov += "SF:" + file + "\n";
        tmp = global._$jscoverage[key];
        if (typeof tmp === 'function' || tmp.length === undefined) return;
        total = touched = 0;
        for (n = 0, len = tmp.length; n < len; n++) {
            if (tmp[n] !== undefined) {
                lcov += "DA:" + n + "," + tmp[n] + "\n";
                total ++;
                if (tmp[n] > 0)
                    touched ++;
            }
        }
        test.equal(total, touched, 'All lines of code exercised by the tests');
    });
    lcov += "end_of_record\n";
    if(process.env.TRAVIS) coveralls.handleInput(lcov);
    test.done();
};
