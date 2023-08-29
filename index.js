const express = require('express')
const app = express()
const cors = require('cors')
const fs = require("fs");
var bodyParser = require('body-parser')

const corsOptions = {
    origin: '*',
    optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}

app.use(cors(corsOptions))
app.use(bodyParser.json())

app.get('/api/get-islands', function (req, res) {
    const data = fs.readFileSync('./islands.json',
        { encoding: 'utf8' });
    res.json({ islands: JSON.parse(data) }).status(200)
})


app.post('/api/set-session', function (req, res) {
    const islands = fs.readFileSync('./islands.json',
        { encoding: 'utf8' });
    const parsedIslands = JSON.parse(islands)
    const findedIsland = parsedIslands.find(island => island.name === req.body.island)
    if(req.body.status === 1){
        findedIsland.ATC.push(req.body.AtcPosition)
    }
    else{
        findedIsland.ATC = findedIsland.ATC.filter(shift => shift != req.body.AtcPosition)
    }

    fs.writeFileSync('./islands.json', JSON.stringify(parsedIslands) )
    res.json({ sessions: JSON.parse(islands) }).status(200)
})

app.listen(80)