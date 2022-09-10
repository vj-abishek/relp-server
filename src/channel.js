module.exports = (server) => {
  const socketIO = require('socket.io');
  const Message = require('./model/Message.model');
  const User = require('./model/User.model');
  const Token = require('./model/Token.model');
  const { notify } = require('./Utils');
  const redis = require('./redis');
  const io = socketIO(server);
  // const users = new Map();

  io.on('connection', (socket) => {
    console.log('Made connection id:', socket.id);

    // Add to public channel
    socket.join('anonymous');

    socket.on('authenticated', async (u) => {
      socket.leave('anonymous');
      socket.join('authenticated');

      redis.hmset(u.uid, { id: socket.id, uid: u.uid });
      redis.hmset(socket.id, { id: socket.id, uid: u.uid });
      // users.set(u.uid, { id: socket.id, uid: u.uid });

      if (u) {
        io.emit('user status', {
          uid: u.uid,
          LastSeen: Date.now(),
          status: 'Online',
        });
        // Add the user status in the database
        const dbUser = await User.exists({ uid: u.uid });
        if (dbUser) {
          await User.where({ uid: u.uid }).updateOne({
            LastSeen: Date.now(),
            status: 'Online',
          });
        } else {
          const newUser = new User({
            uid: u.uid,
            LastSeen: Date.now(),
            status: 'Online',
          });
          newUser.save().then(() => console.log('Added new user'));
        }
      }

      // Search for messages in the database

      const message = await Message.find({ to: u.uid });
      console.log(message);
      if (message) {
        io.to(socket.id).emit('new message', message);
      }
    });

    socket.on('send message', async (message) => {
      console.log(message);
      // const user = UserSocketId(users, message.to);
      const user = await redis.hget(message.to, 'id');
      if (!user) {
        const res = new Message({ ...message });
        res.save().then(() => console.log('Saved Successfully'));
        notify(message);
      } else {
        io.to(user).emit('recieve message', message);
        notify(message);
      }
    });

    socket.on('message recieved', async (message) => {
      await Message.deleteOne({ _id: message._id });
    });

    socket.on('fetch status', async (data) => {
      const res = await User.find({ uid: data.id });
      if (res) {
        io.to(socket.id).emit('user status disk', res);
      }
    });

    // Store notification token
    socket.on('notification token', (data) => {
      const token = new Token(data);
      token
        .save()
        .then(() => console.log('Saved Token '))
        .catch(console.error);
    });

    socket.on('Typing Indicator', async (status) => {
      // const user = UserSocketId(users, status.to);
      const user = await redis.hget(status.to, 'id');

      if (user) {
        io.to(user).emit('Typing Indicator', status);
      }
    });

    socket.on('offer', async ({ from, to, payload }) => {
      console.log({ to, payload });
      // const user = UserSocketId(users, to);
      const user = await redis.hget(to, 'id');

      io.to(user).emit('backOffer', { from, to, payload });
    });

    socket.on('answer', async ({ from, to, payload }) => {
      console.log({ from, to, payload });
      // const user = UserSocketId(users, from);
      const user = await redis.hget(from, 'id');

      io.to(user).emit('backAnswer', { from, to, payload });
    });

    socket.on('shareID', async ({ shareID, finalTo, channelID, ...rest }) => {
      console.log(shareID, finalTo, rest);
      // const user = UserSocketId(users, finalTo);
      const user = await redis.hget(finalTo, 'id');

      io.to(user).emit('shareID', { shareID, channelID, rest });
    });

    socket.on('current channel', async (data) => {
      // const user = UserSocketId(users, data.to);
      const user = await redis.hget(data.to, 'id');

      if (user !== undefined) {
        io.to(user).emit('current channel', data);
      }
    });

    socket.on('created channel', async ({ to }) => {
      // const user = UserSocketId(users, to);
      const user = await redis.hget(to, 'id');

      if (user !== undefined) {
        io.to(user).emit('created channel');
      }
    });

    // Handle Clean up
    socket.on('disconnect', async () => {
      // remove the user from the map
      const uid = await redis.hget(socket.id, 'uid');
      redis.del(socket.id);
      redis.del(uid);

      io.emit('user status', {
        LastSeen: Date.now(),
        status: 'Offline',
        uid,
      });

      // Update the user status in the database
      await User.where({ uid }).updateOne({
        LastSeen: Date.now(),
        status: 'Offline',
      });

      console.log('Disconnected user id :', socket.id);
    });
  });
};
