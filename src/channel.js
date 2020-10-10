module.exports = (server) => {
    const socket = require('socket.io');
    const Message = require('./model/Message.model');
    const User = require('./model/User.model');
    const Token = require('./model/Token.model');
    const { notify, UserSocketId } = require('./Utils');
    const io = socket(server);
    const users = new Map();

    io.on('connection', (socket) => {
        console.log('Made connection id:', socket.id);

        // Add to public channel
        socket.join('anonymous');

        socket.on('authenticated', async (u) => {
            socket.leave('anonymous');
            socket.join('authenticated');

            users.set(u.uid, { id: socket.id, uid: u.uid });

            if (u) {
                console.log(u);
                io.emit('user status',
                    {
                        uid: u.uid,
                        LastSeen: Date.now(),
                        status: 'Online'
                    })
                // Add the user status in the database
                const dbUser = await User.exists({ uid: u.uid });
                if (dbUser) {
                    await User
                        .where({ uid: u.uid })
                        .updateOne({
                            LastSeen: Date.now(),
                            status: 'Online',
                        });
                } else {
                    const newUser = new User({
                        uid: u.uid, LastSeen: Date.now(),
                        status: 'Online'
                    });
                    newUser.save().then(() => console.log("Added new user"));
                };
            };

            // Search for messages in the database

            const message = await Message.find({ to: u.uid });
            console.log(message);
            if (message) {
                io.to(socket.id).emit('new message', message)
            }
            console.log(users);

        });


        socket.on('send message', (message) => {
            console.log(message);
            const user = UserSocketId(users, message.to);
            if (!user) {
                const res = new Message({ ...message });
                res.save().then(() => console.log("Saved Successfully"));
                notify(message);

            } else {
                io.to(user.id).emit('recieve message', message);
                notify(message);
            }
        });

        socket.on('message recieved', async (message) => {
            await Message.deleteOne({ _id: message._id });
        });

        socket.on('fetch status', async (data) => {
            const res = await User.find({ uid: data.id })
            if (res) {
                io.to(socket.id).emit('user status disk', res);
            }
        });

        // Store notification token
        socket.on('notification token', (data) => {
            const token = new Token(data);
            token.save().then(() => console.log("Saved Token "))
                .catch(console.error);
        });

        socket.on('Typing Indicator', (status) => {
            const user = UserSocketId(users, status.to);
            if (user) {
                io.to(user.id).emit('Typing Indicator', status);
            }
        });

        socket.on('offer', ({ from, to, payload }) => {
            console.log({ to, payload });
            const user = UserSocketId(users, to);
            io.to(user.id).emit('backOffer', { from, to, payload });
        });

        socket.on('answer', ({ from, to, payload }) => {
            console.log({ from, to, payload });
            const user = UserSocketId(users, from);
            io.to(user.id).emit('backAnswer', { from, to, payload });
        });

        socket.on('shareID', ({ shareID, finalTo }) => {
            console.log(shareID, finalTo)
            const user = UserSocketId(users, finalTo);
            io.to(user.id).emit('shareID', shareID);
        });

        socket.on('current channel', (data) => {
            const user = UserSocketId(users, data.to);
            if (user !== undefined) {
                io.to(user.id).emit('current channel', data);
            }
        });

        // Handle Clean up
        socket.on("disconnect", async () => {

            const values = users.values();

            for (let v of values) {
                if (v.id === socket.id) {

                    users.delete(v.id);
                    io.emit("user status", {
                        LastSeen: Date.now(),
                        status: 'Offline',
                        uid: v.uid,
                    });

                    // Update the user status in the database
                    await User
                        .where({ uid: v.uid })
                        .updateOne({
                            LastSeen: Date.now(),
                            status: 'Offline',
                        });
                    return;
                }
            };


            console.log('Disconnected user id:', socket.id);
        });
    });

}



