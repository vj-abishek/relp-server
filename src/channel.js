module.exports = (server) => {
    const socket = require('socket.io');
    const io = socket(server);
    let users = []
    let count = 0;

    // configuration for websocket instead of polling
    io.set('transports', ['websocket']);

    io.on('connection', (socket) => {
        console.log('Made connection id:', socket.id);
        count = Object.keys(io.sockets.connected).length;

        // Add the user
        let obj = {
            id: socket.id,
            count,
        }
        users.push(obj);
        // Add to public channel
        socket.join('anonymous');

        // Indicate other users
        socket.broadcast.to('anonymous').emit('users', users);


        // Handle Clean up
        socket.on("disconnect", () => {
            count = count - 1;

            users.forEach((id, i) => {
                if (id.id === socket.id) {
                    users.splice(i, 1)
                }
            })
            io.emit("user disconnected", socket.id);
            console.log('Disconnected user id:', socket.id);
            io.emit('users', users)
        });
    });

}