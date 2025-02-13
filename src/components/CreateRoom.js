"use client"

import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import axios from "axios"
import { v4 as uuidv4 } from "uuid"
import "./CreateRoom.css"

function CreateRoom() {
  const [roomId, setRoomId] = useState("")
  const [callType, setCallType] = useState("group")
  const [isHost, setIsHost] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [waitingUsers, setWaitingUsers] = useState([])
  const [isWaiting, setIsWaiting] = useState(false)
  const [isAdmitted, setIsAdmitted] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const generateRoomId = () => {
    const newRoomId = uuidv4().substring(0, 8)
    setRoomId(newRoomId)
  }

  const handleCreateRoom = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const finalRoomId = roomId || uuidv4().substring(0, 8)

      await axios.post("http://localhost:5001/api/rooms/create", {
        roomId: finalRoomId,
        callType,
        hostId: isHost ? "user-" + Date.now() : "",
      })

      navigate(`/room/${finalRoomId}?type=${callType}&host=${isHost}`)
    } catch (error) {
      setError("Failed to create room. Please try again.")
      console.error("Error creating room:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleJoinRoom = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    if (!roomId) {
      setError("Please enter a room ID")
      setLoading(false)
      return
    }

    try {
      await axios.post("http://localhost:5001/api/rooms/join", {
        roomId,
        participantId: "user-" + Date.now(),
      })
      setIsWaiting(true)
    } catch (error) {
      setError("Failed to join room. Please try again.")
      console.error("Error joining room:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const isHost = params.get("host") === "true"
    if (isHost) {
      const interval = setInterval(() => {
        axios.get(`http://localhost:5001/api/rooms/${roomId}/waiting-users`)
          .then(response => setWaitingUsers(response.data))
          .catch(err => console.error("Error fetching waiting users:", err))
      }, 3000)
      return () => clearInterval(interval)
    }
  }, [roomId, location])

  useEffect(() => {
    if (!isHost && isWaiting) {
      const interval = setInterval(() => {
        axios.get(`http://localhost:5001/api/rooms/${roomId}/status`)
          .then(response => {
            if (response.data.admitted) {
              setIsAdmitted(true)
              navigate(`/room/${roomId}?type=${callType}&host=false`)
            }
          })
          .catch(err => console.error("Error checking admission status:", err))
      }, 3000)
      return () => clearInterval(interval)
    }
  }, [isWaiting, roomId, callType, navigate, isHost])

  const admitUser = async (userId) => {
    try {
      await axios.post(`http://localhost:5001/api/rooms/${roomId}/admit`, { userId })
      setWaitingUsers(waitingUsers.filter(user => user.id !== userId))
    } catch (error) {
      console.error("Error admitting user:", error)
    }
  }

  return (
    <div className="create-room-container">
      <h1>Video Conference</h1>
      {error && <div className="error-message">{error}</div>}
      <form onSubmit={handleCreateRoom}>
        <div className="input-group">
          <input
            type="text"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            placeholder="Enter Room ID or generate one"
            disabled={loading}
          />
          <button type="button" onClick={generateRoomId} className="generate-btn" disabled={loading}>
            Generate ID
          </button>
        </div>
        <select value={callType} onChange={(e) => setCallType(e.target.value)} disabled={loading}>
          <option value="group">Group Call</option>
          <option value="one-on-one">One-on-One Call</option>
        </select>
        <label className="host-checkbox">
          <input type="checkbox" checked={isHost} onChange={(e) => setIsHost(e.target.checked)} disabled={loading} />
          Join as Host
        </label>
        <div className="button-group">
          <button type="submit" className="create-btn" disabled={loading}>
            {loading ? "Creating..." : "Create Room"}
          </button>
          <button type="button" onClick={handleJoinRoom} className="join-btn" disabled={loading || !roomId}>
            {loading ? "Joining..." : "Join Room"}
          </button>
        </div>
      </form>
      {isHost && waitingUsers.length > 0 && (
        <div className="waiting-list">
          <h3>Users Waiting for Approval:</h3>
          {waitingUsers.map(user => (
            <div key={user.id} className="waiting-user">
              <span>{user.name || user.id}</span>
              <button onClick={() => admitUser(user.id)}>Admit</button>
            </div>
          ))}
        </div>
      )}
      {!isHost && isWaiting && !isAdmitted && (
        <div className="waiting-message">
          <h3>Please wait, the host will admit you soon...</h3>
        </div>
      )}
    </div>
  )
}

export default CreateRoom
