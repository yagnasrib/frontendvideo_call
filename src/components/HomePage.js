"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import "./HomePage.css"

function CreateRoom() {
  const [roomId, setRoomId] = useState("")
  const [callType, setCallType] = useState("group")
  const [isHost, setIsHost] = useState(false)
  const navigate = useNavigate()

  const handleCreateRoom = (e) => {
    e.preventDefault()
    navigate(`/room/${roomId}?type=${callType}&host=${isHost}`)
  }

  const handleJoinRoom = (e) => {
    e.preventDefault()
    navigate(`/room/${roomId}?type=${callType}&host=false`)
  }

  return (
    <div className="create-room-container">
      <h1>Video Conference</h1>
      <form onSubmit={handleCreateRoom}>
        <input
          type="text"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          placeholder="Enter Room ID"
          required
        />
        <select value={callType} onChange={(e) => setCallType(e.target.value)}>
          <option value="group">Group Call</option>
          <option value="one-on-one">One-on-One Call</option>
        </select>
        <label>
          <input type="checkbox" checked={isHost} onChange={(e) => setIsHost(e.target.checked)} />
          Join as Host
        </label>
        <div className="button-group">
          <button type="submit" className="create-btn">
            Create Room
          </button>
          <button type="button" onClick={handleJoinRoom} className="join-btn">
            Join Room
          </button>
        </div>
      </form>
    </div>
  )
}

export default CreateRoom

