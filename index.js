const express = require('express')
const app = express()
const cors = require('cors')
const fs = require("fs");
var bodyParser = require('body-parser')
const { Server } = require("socket.io");

const corsOptions = {
    origin: '*',
    optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token === '41cd5001-21e8-bce2-2dbb-8472fc0066f6') {
       return next();
    }
    return res.sendStatus(401); // Unauthorized

}

app.use(cors(corsOptions))
app.use(bodyParser.json())
// app.use(authenticateToken);

app.get('/cronTask', (req, res) => {
    console.log('Кронинг')
    res.status(201).json({ message: 'Успешный крауд' });
});

const io = new Server({
    cors: {
        origin: "*"
    },
});

io.on('connection', (socket) => {
    console.log('new user connected');
    socket.on('getIslands', () => {
        const data = fs.readFileSync('./islands.json',
            {encoding: 'utf8'});

        socket.emit('responseIslands',{islands: JSON.parse(data)})
    });
    socket.on('setSession', (payload) => {
       console.log('CREATE SESSION LOG')
        const parsedPayload = JSON.parse(payload)
        const islands = fs.readFileSync('./islands.json',
            {encoding: 'utf8'});
        const parsedIslands = JSON.parse(islands)
    //
        const findedIsland = parsedIslands.find(island => island.name === parsedPayload?.island)
        if (parsedPayload.status === 1) {
            console.log('status 1')
            findedIsland.ATC.push(parsedPayload?.AtcPosition)
        } else if (parsedPayload.status === 0) {
            findedIsland.ATC = findedIsland.ATC.filter(shift => shift !== parsedPayload?.AtcPosition)
        }

        fs.writeFileSync('./islands.json', JSON.stringify(parsedIslands))
        socket.broadcast.emit('responseIslands', {islands: parsedIslands})
    });
    socket.on('setFlight', (payload) => {
        const islands = fs.readFileSync('./islands.json',
            {encoding: 'utf8'});
        const parsedIslands = JSON.parse(islands)
        const parsedPayload = JSON.parse(payload)

        const findedIsland = parsedIslands.find(island => island.name === parsedPayload.from)
        findedIsland.flights.push(parsedPayload)

        fs.writeFileSync('./islands.json', JSON.stringify(parsedIslands))
        socket.broadcast.emit('responseIslands',{islands: parsedIslands})
    });
    socket.on('endFlight', (payload) => {
        const islands = fs.readFileSync('./islands.json',
            {encoding: 'utf8'});
        const parsedIslands = JSON.parse(islands)
        const parsedPayload = JSON.parse(payload)

        const findedIsland = parsedIslands.find(island => island.name === parsedPayload.from)
        findedIsland.flights = findedIsland.flights.filter(flight => flight.user !== parsedPayload.user)

        fs.writeFileSync('./islands.json', JSON.stringify(parsedIslands))
        socket.broadcast.emit('responseIslands',{islands: parsedIslands})
    })
});

io.listen(80);


const PORT = process.env.PORT || 443;
app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});
