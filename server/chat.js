const express  = require("express")
const app = express();
const {Server} = require("Socket.io");
const cors = require("cors")
const http = require("http")
const bodyParser = require("body-parser")
const dataStore = require('./data')
const {graphqlHTTP} = require('express-graphql')
const mongoose = require('mongoose')
require('dotenv').config()
const MONGO_DB = process.env.MONGO_DB

//

const schema =require('./graphqlSchema')
const rootValue = require('./graphqlResolvers');
const User = require('./models');
const { connect } = require("http2");
const msgContainer = require('./msgContainer');
const { createUser } = require("./graphqlResolvers");

const connectDB = async()=>{ await mongoose.connect(MONGO_DB).then((res)=>{
    console.log("Mongodb is connected")
}).catch((err)=>{
    console.log(err,"error occured")
})}
connectDB();

// middlewares
app.use(cors())

//creating server
const server = http.createServer(app)

//creating io
const io = new Server(server, {
    cors:{
        origin:"http://localhost:3000",
        credentials: true,
        methods:["GET", "POST"],
    }
})



// aync function for saving data in mongodb
async function saveMessage(users,data){
    await mongoose.connect(MONGO_DB).then((res)=>{
        console.log("Mongodb is connected")
        console.log("---------------------data------------------------")
        console.log("msg data is", data)
        console.log("----------------------users------------------------")
        console.log("this is users", users)
        var checkUser =0
        var messengerExist = 0;
        // saving message in mongodb corresponding to the socket emailid
        for (let user of users){ // iterate over the users obtained by the socket.io
            console.log(data.to, user.userID)
            if (data.to === user.userID) {//check if receiver socket matches with any socket id
                var toEmail = user.emailID;//if matched then we will save that emailid
                console.log(toEmail, "to email...")
                for (let user of users){// iterate over the users obtained by the socket.io
                    if (data.from === user.userID){//check if the sender socket matches with any socket id
                        checkUser = checkUser+1;
                        var fromEmail = user.emailID // if matched then we will save the emailid of sender
                        console.log(fromEmail, "from email...")
                        const checkLength = msgContainer.findOne({receiverEmailID:toEmail, senderEmailID:fromEmail},(err, docs)=>{
                            console.log(docs, "this is docs findone")
                            console.log("---------------",messengerExist, "-----------------------this is messenger");
                            let update=false;
                            if (docs) {update = true};
                            console.log(update, "change")
                            if (update){
                                try{
                                    msgContainer.updateOne({receiverEmailID:toEmail, senderEmailID:fromEmail},
                                        {
                                            $push: {
                                            messageArray: {
                                                message: data.message,
                                            
                                            }
                                            }
                                        }
                                        ,(err, docs)=>{
                                            if (err) return console.log(err);
                                            console.log(docs, "this is docs asshole");
                                            // senderEmail.update({receiverEmailID:'chunchun@gmail.com', senderEmailID:"nagmani@gmail.com"}, {$push: {message:"there you go" }});

                                    })
                                    // console.log(senderEmail,"this is senderEmail")
                                    
                                } catch (err){
                                    throw err;
                                }
                            }else {
                                console.log("creating user")
                                try{
                                    // console.log(senderEmail.senderEmailID)
                                    const newMessenger = new msgContainer({
                                        receiverEmailID:toEmail,
                                        senderEmailID:fromEmail,
                                        messageArray:
                                        {
                                            message:data.message
                                        }
                                    }) 
                                    newMessenger.save()
                                    console.log("newMessenger created")
                                }catch (err){
                                    console.log("err occured",err)
                                }
                            }
                    })

                    }
                }
            }
        }
        console.log("check checkUser", checkUser);
        
        console.log("iteration ended....&&&&")

    }).catch((err)=>{
        console.log(err,"error occured")
    })
    connectDB();
}
//creating usename as attribute for the socket
io.use((socket, next)=>{
    const emailID = socket.handshake.auth.emailID;    
    const username = socket.handshake.auth.userName;
    if (!username || !emailID) throw Error("Username and Email is required");
    socket.username = username;
    socket.emailID = emailID;
    console.log(socket.username, socket.emailID,"is the user id .........3")
    // console.log(socket.username, 'created socket meta data---------------3')
    next()
})

// setting a connection with the front-end webpage
io.on('connection', async (socket)=>{
    let users = []
    console.log("SOCKETS----------",Object.keys(io.sockets.sockets),"-----------------")
    for (let [id, socket] of io.sockets.sockets) {
        users.push({
        userID: id,
        emailID:socket.emailID,
        username: socket.username,
        }
        );
        // console.log(users,"all users -----------4")
    }
    console.log(users, "all users------------------5")
    socket.emit("users count",users, ()=>{
        console.log("emitter----------------")
    })
    console.log("users are emitted -------------------------6")
    socket.broadcast.emit('user connected', {
        userID: socket.id,
        emailID:socket.emailID,
        username: socket.username,
    })
    console.log("users are broadcasted------------9")

    socket.on('sendmessage', (data)=>{
        const Users= [];
        for (let [id, socket] of io.sockets.sockets) {
            Users.push({
            userID: id,
            emailID:socket.emailID,
            username: socket.username,
            }
            );
            // console.log(users,"all users -----------4")
        }
        console.log(Users,"********************************")
        console.log("we received the message on sever side")
        saveMessage(Users,data);
        console.log(data.message,data.to,data.from, socket.id,"is the message received from the client")
        socket.to(data.to).emit('receivedMessage',data.message)
    })

})

//OPENING server at port 5000
server.listen(5000,
    graphqlHTTP({
        schema,
        rootValue
    }),
    ()=>{
    console.log("server is listening from chat.js")
})