const notify = async (message) => {
  const Token = require('./model/Token.model');
  const axios = require('axios').default;
  try {
    const token = await Token.find({ uid: message.to });
    console.log(token);
    if (token) {
      const res = await axios({
        method: 'POST',
        url: 'https://fcm.googleapis.com/fcm/send',
        'Content-Type': 'application/json',
        headers: {
          Authorization: `key=${process.env.key}`,
        },
        data: {
          to: token[0].token,
          data: {
            title: 'Hello world',
            body: message,
          },
        },
      });

      console.log(res.status);
    }
  } catch (err) {
    console.log(err);
  }
};

const UserSocketId = (users, uid) => users.get(uid);

module.exports = {
  notify,
  UserSocketId,
};
