import React, { useEffect, useRef, useState } from "react";
import { ZegoUIKitPrebuilt } from "@zegocloud/zego-uikit-prebuilt";
import humanId from "human-id";
import axios from "axios";
import "./App.css";

function App() {
  const [kitToken, setKitToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Generate or retrieve room ID from URL
  let roomID = window.location.pathname.substring(1);

  if (!roomID) {
    roomID = humanId({ separator: "_", capitalize: false });
    window.history.pushState({}, "", "/" + roomID);
  }

  const roomRef = useRef(null); // Reference to the video container

  // Fetch the kitToken from the backend
  useEffect(() => {
    const fetchToken = async () => {
      try {
        console.log("Fetching token with:", {
          roomID,
          userID: humanId(),
          userName: humanId({ adjectiveCount: 0 }),
        });

        const response = await axios.post("http://localhost:5001/api/meetings/generate-token", {
          roomID,
          userID: humanId(),
          userName: humanId({ adjectiveCount: 0 }),
        });

        console.log("Response from token request:", response.data);

        if (response.data && response.data.kitToken) {
          setKitToken(response.data.kitToken); // Save token to state
          setLoading(false); // Once token is set, stop loading
        } else {
          console.error("Error: Token not received.");
          setLoading(false);
        }
      } catch (error) {
        console.error("Error fetching token:", error);
        setLoading(false);
      }
    };

    fetchToken();
  }, [roomID]);

  useEffect(() => {
    if (!roomRef.current) {
      console.error("Error: Video container not found.");
      return;
    }

    const appID = Number(process.env.REACT_APP_APP_ID);
    const serverSecret = process.env.REACT_APP_SERVER_SECRET;

    if (!appID || !serverSecret) {
      console.error("Error: Missing APP_ID or SERVER_SECRET in .env.");
      return;
    }

    // Generate Kit Token for Authentication
    const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
      appID,
      serverSecret,
      roomID,
      humanId(),
      humanId({ adjectiveCount: 0 })
    );

    const zp = ZegoUIKitPrebuilt.create(kitToken);

    // ✅ Initialize Video Call with Full UI
    zp.joinRoom({
      container: roomRef.current,
      sharedLinks: [{ name: "Room Link", url: window.location.href }],
      scenario: { mode: ZegoUIKitPrebuilt.GroupCall },

      showScreenSharingButton: true,
      showLeavingView: true,
      showMicrophoneButton: true,
      showCameraButton: true,
      showUserList: true,
      showTextChat: true,
      showLayoutButton: true,
      turnOnCameraWhenJoining: true,
      turnOnMicrophoneWhenJoining: true,
    });

  }, [roomID]);

  return (
    <div className="container">
      <h1>Video Conference</h1>
      <p>
        Share this link to invite others:{" "}
        <a href={window.location.href}>{window.location.href}</a>
      </p>

      {/* ✅ This div holds the video conference UI */}
      <div className="video-container" ref={roomRef} />
    </div>
  );
}

export default App;

