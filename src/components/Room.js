"use client"

import { useRef, useState, useEffect, useCallback } from "react"
import { useParams, useLocation, useNavigate } from "react-router-dom"
import { ZegoUIKitPrebuilt } from "@zegocloud/zego-uikit-prebuilt"
import axios from "axios"
import { APP_ID, SECRET } from "../Config"
import "./Room.css"

export default function Room() {
  const { roomId } = useParams()
  const userName = localStorage.getItem("userName") || "Guest User"
  const userEmail = localStorage.getItem("userEmail") || ""
  const location = useLocation()
  const navigate = useNavigate()
  const zpRef = useRef(null)
  const videoContainerRef = useRef(null)
  const audioContextInitialized = useRef(false)
  const [joined, setJoined] = useState(false)
  const [callType, setCallType] = useState("")
  const [isHost, setIsHost] = useState(false)
  const [waitingParticipants, setWaitingParticipants] = useState([])
  const [isWaiting, setIsWaiting] = useState(false)
  const [isAdmitted, setIsAdmitted] = useState(false)

  const initializeAudioContext = useCallback(() => {
    if (!audioContextInitialized.current) {
      const AudioContext = window.AudioContext || window.webkitAudioContext
      const audioContext = new AudioContext()
      audioContext.resume().then(() => {
        audioContextInitialized.current = true
        console.log("AudioContext initialized")
      })
    }
  }, [])

  const myMeeting = useCallback(
    async (type) => {
      try {
        const apiUrl = process.env.REACT_APP_API_URL
        const response = await axios.get(`${apiUrl}/api/rooms/${roomId}`)
        const roomData = response.data

        initializeAudioContext()

        const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
          APP_ID,
          SECRET,
          roomId,
          Date.now().toString(),
          userName,
        )

        const zp = ZegoUIKitPrebuilt.create(kitToken)
        zpRef.current = zp

        zp.joinRoom({
          container: videoContainerRef.current,
          scenario: {
            mode: type === "one-on-one" ? ZegoUIKitPrebuilt.OneONoneCall : ZegoUIKitPrebuilt.GroupCall,
          },
          showTurnOffRemoteCameraButton: isHost,
          showTurnOffRemoteMicrophoneButton: isHost,
          showRemoveUserButton: isHost,
          maxUsers: type === "one-on-one" ? 2 : 10,
          onJoinRoom: () => {
            setJoined(true)
            if (!isHost) {
              setIsWaiting(true)
            }
          },
          onUserJoin: (users) => {
            if (isHost) {
              setWaitingParticipants((prev) => [...prev, ...users])
            }
          },
          onUserLeave: (users) => {
            setWaitingParticipants((prev) => prev.filter((p) => !users.some((u) => u.userID === p.userID)))
          },
          onLeaveRoom: () => {
            if (!isHost) {
              navigate("/")
            }
          },
        })
      } catch (error) {
        console.error("Error fetching room data:", error)
        navigate("/")
      }
    },
    [roomId, isHost, userName, navigate, initializeAudioContext],
  )

  const handleAdmitParticipant = async (participant) => {
    if (!isHost) return
    try {
      const apiUrl = process.env.REACT_APP_API_URL
      if (zpRef.current) {
        await axios.post(`${apiUrl}/api/rooms/join`, {
          roomId,
          participantId: participant.userID,
        })
        setWaitingParticipants((prev) => prev.filter((p) => p.userID !== participant.userID))
        zpRef.current.sendCustomCommand([participant.userID], "admit")
      }
    } catch (error) {
      console.error("Failed to admit participant:", error)
    }
  }

  const handleMuteAll = () => {
    if (!isHost || !zpRef.current) return
    zpRef.current.muteAllParticipants()
  }

  useEffect(() => {
    const query = new URLSearchParams(location.search)
    setCallType(query.get("type"))
    setIsHost(query.get("host") === "true")
  }, [location.search])

  useEffect(() => {
    if (callType) {
      myMeeting(callType)
    }
    return () => {
      if (zpRef.current) {
        zpRef.current.destroy()
      }
    }
  }, [callType, myMeeting])

  useEffect(() => {
    if (zpRef.current && !isHost) {
      zpRef.current.on("receiveCustomCommand", (fromUser, command) => {
        if (command === "admit" && !isHost) {
          setIsWaiting(false)
          setIsAdmitted(true)
        }
      })
    }
  }, [isHost])

  if (isWaiting && !isHost && !isAdmitted) {
    return (
      <div className="waiting-room" onClick={initializeAudioContext}>
        <h2>Waiting Room</h2>
        <p>Please wait for the host to admit you...</p>
      </div>
    )
  }

  return (
    <div className="room-container" onClick={initializeAudioContext}>
      <h3>
        Room Link: <a href={window.location.href}>{window.location.href}</a>
      </h3>
      {isHost && joined && (
        <div className="host-controls">
          <button onClick={handleMuteAll} className="mute-all-btn">
            Mute All
          </button>
          {waitingParticipants.length > 0 && (
            <div className="waiting-participants">
              <h3>Waiting Participants:</h3>
              {waitingParticipants.map((participant) => (
                <div key={participant.userID} className="waiting-participant">
                  <span>{participant.userName || "Guest User"}</span>
                  <button className="admit-btn" onClick={() => handleAdmitParticipant(participant)}>
                    Admit
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      <div ref={videoContainerRef} className="video-container" />
    </div>
  )
}
