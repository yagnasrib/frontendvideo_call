import { BrowserRouter as Router, Route, Routes } from "react-router-dom"
import CreateRoom from "./components/CreateRoom"
import Room from "./components/Room";  


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<CreateRoom />} />
        <Route path="/room/:roomId" element={<Room />} />
      </Routes>
    </Router>
  )
}

export default App

