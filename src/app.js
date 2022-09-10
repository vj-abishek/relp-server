require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const mongodb = require('./mongo');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(
  cors({
    origin: ['http://localhost:3030', 'http://locahost:3000'],
    optionsSuccessStatus: 200,
  }),
);
app.use(morgan('dev'));

app.get('/', (req, res) => {
  res.json({ msg: 'V1 relp server' });
});

// Checking the connection
mongodb.connection
  .on('open', () => console.log('Successfully connected to the db'))
  .once('error', () => console.log('An error occured'));

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`http://localhost:${PORT}`);
});

require('./channel')(server);

module.exports = app;
