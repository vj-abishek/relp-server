const express = require('express');
const morgan = require('morgan');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3030;

app.use(cors({
    origin: ['http://localhost:3030', 'http://locahost:3000'],
    optionsSuccessStatus: 200
}
));
app.use(morgan('dev'));

app.get('/', (req, res) => {
    res.json({ msg: 'V1 relp server' })
})

const server = app.listen(PORT, () => {
    try {
        const os = require('os');
        const network = os.networkInterfaces();
        console.log('Local and Network Urls:');
        console.log(`http://localhost:${PORT}`);
        console.log(`http://${network.eth0[0].address}:${PORT}`);
    } catch (err) {
        console.log(`http://locahost:${PORT}`)
    }
});

require('./channel')(server);