const cluster = require('cluster');

if (cluster.isMaster) {
    const numWorkers = require('os').cpus().length;

    console.log('Master cluster setting up ' + numWorkers + ' workers...');

    for (let i = 0; i < numWorkers; i++) {
        cluster.fork();
    }


    cluster.on('exit', function (worker, code, signal) {
        cluster.fork();
    });
} else {
    require('./app');
}