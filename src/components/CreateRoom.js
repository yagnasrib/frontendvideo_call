"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import { v4 as uuidv4 } from "uuid"
import { GoogleLogin, googleLogout, useGoogleLogin } from "@react-oauth/google"
import "./CreateRoom.css"

function CreateRoom() {
  const [roomId, setRoomId] = useState("")
  const [callType, setCallType] = useState("group")
  const [isHost, setIsHost] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [googleUser, setGoogleUser] = useState(null)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const navigate = useNavigate()

  const generateRoomId = () => {
    const newRoomId = uuidv4().substring(0, 8)
    setRoomId(newRoomId)
  }

  const handleGoogleLoginSuccess = async (response) => {
    try {
      const token = response.credential
      const res = await axios.post("http://localhost:5001/api/auth/google-login", { token })
      setGoogleUser(res.data)
      console.log("Google User:", res.data)
    } catch (error) {
      setError("Google authentication failed.")
      console.error("Google Login Error:", error)
    }
  }

  const handleLogout = () => {
    googleLogout()
    setGoogleUser(null)
    setShowProfileMenu(false)
  }

  const addAnotherAccount = useGoogleLogin({
    onSuccess: handleGoogleLoginSuccess,
    onError: () => setError("Failed to add another account."),
  })

  const handleCreateRoom = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const finalRoomId = roomId || uuidv4().substring(0, 8)

      await axios.post("http://localhost:5001/api/rooms/create", {
        roomId: finalRoomId,
        callType,
        hostId: isHost ? googleUser?.email || "user-" + Date.now() : "",
      })

      localStorage.setItem("userName", googleUser?.name || "Guest User")
      localStorage.setItem("userEmail", googleUser?.email || "")

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
        participantId: googleUser?.email || "user-" + Date.now(),
      })
      localStorage.setItem("userName", googleUser?.name || "Guest User")
      localStorage.setItem("userEmail", googleUser?.email || "")
      navigate(`/room/${roomId}?type=${callType}&host=false`)
    } catch (error) {
      setError("Failed to join room. Please try again.")
      console.error("Error joining room:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="create-room-container">
      <div className="header">
        <h1>Video Conference</h1>
        {googleUser ? (
          <div className="profile-section">
            <img
              src={googleUser.picture}
              alt="Profile"
              className="profile-image"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
            />
            {showProfileMenu && (
              <div className="profile-dropdown">
                <p>{googleUser.name}</p>
                <p>{googleUser.email}</p>
                <button onClick={addAnotherAccount} className="add-account-btn">+ Add Another Account</button>
                <button onClick={handleLogout} className="logout-btn">Sign Out</button>
              </div>
            )}
          </div>
        ) : (
          <GoogleLogin onSuccess={handleGoogleLoginSuccess} onError={() => setError("Failed to sign in with Google.")} />
        )}
      </div>

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
    </div>
  )
}

export default CreateRoom
