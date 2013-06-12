var jscoverage = require('jscoverage');
jscoverage.enableCoverage(true);
var coveralls = require('coveralls');
var redisManager = jscoverage.require(module, '../lib/redis-manager');

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

exports.pubsub = function(test) {
    test.expect(1);
    var client1 = redisManager.getClient(6379, 'localhost');
    var client2 = redisManager.getClient(6379, 'localhost', { pubsub: true });
    test.notEqual(client1, client2);
    redisManager.freeClient(client1);
    redisManager.freeClient(client2);
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
