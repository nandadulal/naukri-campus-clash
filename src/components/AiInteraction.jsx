import { useState, useRef } from "react";
import { Mic, MicOff } from "lucide-react";

export default function AiInteraction() {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [aiReply, setAiReply] = useState("");
  const recognitionRef = useRef(null);

  // start speech recognition
  const startListening = () => {
    if (!("webkitSpeechRecognition" in window)) {
      alert("Speech recognition not supported in this browser.");
      return;
    }

    const recognition = new window.webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.lang = "en-US";

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);

    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript;
      setTranscript(text);

      // simulate AI response
      const reply = "I heard you say: " + text;
      setAiReply(reply);

      // simple text-to-speech
      const utter = new SpeechSynthesisUtterance(reply);
      speechSynthesis.speak(utter);
    };

    recognition.start();
    recognitionRef.current = recognition;
  };

  // stop speech recognition
  const stopListening = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-gray-50 text-gray-800 relative">
      {/* Avatar */}
      <div className="w-48 h-48 rounded-full overflow-hidden border-4 border-blue-400 shadow-lg">
        <img
          src="https://api.dicebear.com/9.x/bottts/svg?seed=ai-avatar"
          alt="AI Avatar"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Transcript + AI reply */}
      <div className="mt-6 text-center">
        <p className="text-lg font-medium text-gray-600">
          {transcript ? `You: ${transcript}` : "🎙 Speak to start interaction"}
        </p>
        <p className="mt-2 text-xl font-semibold text-blue-700">
          {aiReply}
        </p>
      </div>

      {/* Controls like Google Meet (bottom center) */}
      <div className="absolute bottom-8 flex space-x-6">
        <button
          onClick={listening ? stopListening : startListening}
          className={`p-4 rounded-full shadow-lg transition ${
            listening ? "bg-red-500 text-white" : "bg-blue-500 text-white"
          }`}
        >
          {listening ? <MicOff size={28} /> : <Mic size={28} />}
        </button>
      </div>
    </div>
  );
}
