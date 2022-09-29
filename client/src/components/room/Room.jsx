import React, { useState } from 'react'
import './Room.css'
import io from 'socket.io-client'
import Chat from '../chat/Chat'

const socket = io.connect('http://localhost:5000') // always keep this one out of function component

const Room = () => {
   const [userName, setUserName] = useState('')
   const [roomName, setRoomName] = useState('')
  const [showRegister, setShowRegister] = useState(true)
  const Createroom =()=>{
    if (roomName !== ''){
        console.log(roomName,userName, socket.id)
        socket.emit('create-room',roomName)
        setShowRegister(false)
    }
}
  return (
    <>
    {showRegister?
    <div className='room-wrapper'>
        <div className="r-room"><input placeholder="username" className="r-roomName" onChange={(event)=>setUserName(event.target.value)} /></div>
        <div className="r-name"><input placeholder='room name' type="text" className="r-userName" onChange={(event)=>setRoomName(event.target.value)}/></div>
        <div className="r-button"><button className="btn" onClick={Createroom}>Join Room</button></div>
    </div>:
    <Chat socket={socket} userName={userName} roomName={roomName}/>
    }
    </>
  )
}

export default Room