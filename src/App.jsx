import { useState, useEffect } from 'react';
import { Routes, Route } from "react-router-dom";
import './App.css';

import LandingPage from './components/LandingPage.jsx';
import AiInteraction from './components/AiInteraction.jsx';
import GeminiAudioChat from "./components/GeminiConnection/GeminiAudioChat";
import Vibe from './components/Vibe.jsx';

function App() {
  const [userName, setUserName] = useState(null);

  useEffect(() => {
    // Check if username exists in localStorage
    const storedUserName = localStorage.getItem("user_name");
    if (storedUserName) {
      setUserName(storedUserName);
    } else {
      // Fetch from API if not in localStorage
      const fetchUserName = async () => {
        try {
          const response = await fetch(
            "https://central8.dev.sg1.chsh.in/gamification/api/api/user/"
          );
          if (!response.ok) throw new Error("Failed to fetch username");
          const data = await response.json();

          // Assuming API response looks like { user_name: "John" }
          if (data?.user_name) {
            setUserName(data.user_name);
            localStorage.setItem("user_name", data.user_name);
          }
        } catch (error) {
          console.error("Error fetching username:", error);
        }
      };

      fetchUserName();
    }
  }, []);

  return (
    <>
      <Routes>
        <Route path="/" element={<LandingPage userName={userName} />} />
        <Route path="/about" element={<AiInteraction userName={userName} />} />
        <Route path="/vibe" element={<Vibe userName={userName} />} />
        <Route path="/audio-chat" element={<GeminiAudioChat userName={userName} />} />
      </Routes>
    </>
  );
}

export default App;
