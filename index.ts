import express from 'express'
import { Server } from 'socket.io'
import { createServer } from 'http'

const app = express()
const io = new Server(createServer(app))

app.use(express.static('public'))

app.get('/', (req,res)=>res.sendFile('./src/index.html'))

io.on('connection', socket=>{

});

app.listen(process.env.PORT, ()=>console.log(`Ready! http://localhost:${process.env.PORT}`));