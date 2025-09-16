import React, { useState, useEffect, useRef, use } from "react";
// import classnames from 'classnames';
// import { useDispatch } from 'react-redux';
// import { submitTest } from '../../actions/test';
import useDhwani from "./useDhwani";
import AudioSocket from "./AudioSocket";
import LoaderIcon from "./loader.svg";
import ConversifyModal from "./ConversifyModal.jsx";
import {
  TEST_STATUS,
  TIME_LEFT_FOR_COMPLETION,
  WEB_SOCKET_CONFIG,
} from "./constants.js";
import "./index.css";

/**
 * AIInterview Component
 * Handles real-time audio/video interview with Dhwani AI
 * - Uses a single AudioContext for capture + playback
 * - Manages audio stream, playback, and visualizer state
 * - Handles websocket and worker communication via useDhwani
 */
const GeminiAudioChat = ({ profileImg }) => {
  // Refs for managing media streams and audio processing
  // const webcamRef = useRef(null);
  const audioContextRef = useRef(null); // SINGLE AudioContext
  const processorRef = useRef(null);
  const micStreamRef = useRef(null); // store gUM stream for proper stop()
  const playbackTime = useRef(null);
  const audioQueue = useRef([]);
  const botText = useRef("");
  const isProcessingQueue = useRef(false);
  const currentlyPlayingQueue = useRef([]);

  // State
  const [isDhwaniSpeaking, setIsDhwaniSpeaking] = useState(false);
  const [websocketUrl, setWebSocketUrl] = useState(null);
  const [scenarioDesc, setScenarioDesc] = useState('');
  const [scenarioTitle, setScenarioTitle] = useState('');
  const [userText, setUserText] = useState("");
  const [loader, setLoader] = useState(false);
  const [state, setState] = useState(TEST_STATUS.PAUSED);
  const [infoStates, setInfoStates] = useState({
    isMicAudioDetected: false,
    isCurrentBotTurn: false,
    botText: "",
  });
  // const [userAudioData, setUserAudioData] = useState(null);
  // const [dhwaniVisualizer, setDhwaniVisualizer] = useState(null);
  const [modalDetails, setModalDetails] = useState(null);

  // const dispatch = useDispatch();
  const isDhwaniSpeakingRef = useRef(isDhwaniSpeaking);

  // Audio buffer size for ScriptProcessorNode and Float32Array
  const AUDIO_BUFFER_SIZE = 4096;

  const cleanupAudio = async () => {
    try {
      // Stop audio processing node
      if (processorRef.current) {
        try {
          processorRef.current.disconnect();
        } catch {
          console.error("Failed to disconnect processor");
        }
        processorRef.current = null;
      }

      // Stop any currently queued/playing sources
      if (currentlyPlayingQueue.current.length) {
        currentlyPlayingQueue.current.forEach((src) => {
          try {
            src.stop();
          } catch {
            console.log("Failed to stop source");
          }
          try {
            src.disconnect();
          } catch {
            console.log("Failed to disconnect source");
          }
        });
        currentlyPlayingQueue.current = [];
      }

      // Stop microphone tracks
      if (micStreamRef.current) {
        try {
          micStreamRef.current.getTracks().forEach((t) => t.stop());
        } catch {
          console.error("Failed to stop mic tracks");
        }
        micStreamRef.current = null;
      }

      // Close the single AudioContext
      if (audioContextRef.current) {
        try {
          await audioContextRef.current.close();
        } catch {
          console.error("Failed to close AudioContext");
        }
        audioContextRef.current = null;
      }
      playbackTime.current = null;
    } catch (err) {
      console.error("Error during audio cleanup:", err);
    }
  };

  const initializeAudio = async (sendMessageFn) => {
    try {
      if (
        !audioContextRef.current ||
        audioContextRef.current.state === "closed"
      ) {
        audioContextRef.current = new (window.AudioContext ||
          window.webkitAudioContext)({
          latencyHint: "interactive",
        });
      }

      // Request mic stream
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
        },
        video: false,
      });
      micStreamRef.current = stream;
      console.log("stream1", stream);
      // Create a processor on the SAME context
      const ctx = audioContextRef.current;
      const processor = ctx.createScriptProcessor(AUDIO_BUFFER_SIZE, 1, 1);
      processor.connect(ctx.destination); // keep as-is to keep node active in some browsers

      const input = ctx.createMediaStreamSource(stream);
      input.connect(processor);

      processor.onaudioprocess = (e) => {
        const channelData = e.inputBuffer.getChannelData(0);
        const inputBuffer = new Float32Array(channelData);
        console.log("channelData", channelData);
        // console.log("inputBuffer1", inputBuffer);
        // sendMessageFn({ type: 'audio_stream', data: inputBuffer });
      };

      processorRef.current = processor;
    } catch (err) {
      console.error("Error initializing audio:");
      // errorLogger(err, { location: 'AIInterview.initializeAudio' });
    }
  };

  //   const initializeAudio = async (sendMessageFn) => {
  //   try {
  //     if (!audioContextRef.current || audioContextRef.current.state === "closed") {
  //       audioContextRef.current = new (window.AudioContext ||
  //         window.webkitAudioContext)({
  //         latencyHint: "interactive",
  //       });
  //     }

  //     const ctx = audioContextRef.current;

  //     // ensure AudioContext is running (must be after user gesture)
  //     if (ctx.state !== "running") {
  //       await ctx.resume();
  //     }

  //     // 🎙️ request microphone
  //     const stream = await navigator.mediaDevices.getUserMedia({
  //       audio: {
  //         echoCancellation: true,
  //         noiseSuppression: true,
  //         autoGainControl: true,
  //         channelCount: 1,
  //       },
  //     });
  //     micStreamRef.current = stream;

  //     // 🔧 define AudioWorkletProcessor inline
  //     const processorCode = `
  //       class MicProcessor extends AudioWorkletProcessor {
  //         process(inputs) {
  //           const input = inputs[0];
  //           if (input && input[0]) {
  //             // Send Float32Array back to main thread
  //             this.port.postMessage(input[0]);
  //           }
  //           return true;
  //         }
  //       }
  //       registerProcessor("mic-processor", MicProcessor);
  //     `;

  //     const blob = new Blob([processorCode], { type: "application/javascript" });
  //     const url = URL.createObjectURL(blob);
  //     await ctx.audioWorklet.addModule(url);
  //     URL.revokeObjectURL(url);

  //     // 🎛️ create the node
  //     const micNode = new AudioWorkletNode(ctx, "mic-processor");

  //     micNode.port.onmessage = (event) => {
  //       const audioData = event.data; // Float32Array of PCM samples
  //       sendMessageFn?.({ type: "audio_stream", data: audioData });
  //     };

  //     // 🔗 connect mic → worklet
  //     const input = ctx.createMediaStreamSource(stream);
  //     input.connect(micNode);

  //     // 📴 keep graph alive but mute output
  //     const gainNode = ctx.createGain();
  //     gainNode.gain.value = 0;
  //     micNode.connect(gainNode).connect(ctx.destination);

  //     processorRef.current = micNode;
  //   } catch (err) {
  //     console.error("Error initializing audio:", err);
  //   }
  // };

  const processQueue = async () => {
    if (audioQueue.current.length === 0) {
      isProcessingQueue.current = false;
      return;
    }

    isProcessingQueue.current = true;
    setIsDhwaniSpeaking(true);
    try {
      const ctx = audioContextRef.current;
      const arrayBuffer = audioQueue.current.shift();
      const decodedBuffer = await ctx.decodeAudioData(arrayBuffer);
      const source = ctx.createBufferSource();
      source.buffer = decodedBuffer;
      source.connect(ctx.destination);

      source.onended = () => {
        currentlyPlayingQueue.current = currentlyPlayingQueue.current.filter(
          (s) => s !== source
        );
        if (currentlyPlayingQueue.current.length === 0) {
          isProcessingQueue.current = false;
          setIsDhwaniSpeaking(false);
        }
      };
      currentlyPlayingQueue.current.push(source);
      const startTime = Math.max(
        playbackTime.current || 0,
        ctx.currentTime || 0
      );
      source.start(startTime);
      playbackTime.current = startTime + decodedBuffer.duration;
      isProcessingQueue.current = false;
      processQueue();
    } catch (err) {
      console.error("Error processing audio queue:", err);
      // errorLogger(err, { location: 'AIInterview.processQueue' });
      isProcessingQueue.current = false;
    }
  };
  // /**
  //  * Play audio response from Dhwani on the SAME AudioContext
  //  * @param {ArrayBuffer|TypedArray} audioBuffer - The audio buffer to play
  //  */
  // const playAudioResponse = async (audioBuffer) => {
  //   try {
  //     // Ensure audio context exists
  //     if (
  //       !audioContextRef.current ||
  //       audioContextRef.current.state === "closed"
  //     ) {
  //       audioContextRef.current = new (window.AudioContext ||
  //         window.webkitAudioContext)({});
  //     }

  //     // Accept both ArrayBuffer and TypedArray
  //     const arrayBuffer =
  //       audioBuffer instanceof ArrayBuffer ? audioBuffer : audioBuffer.buffer;

  //     // Add decoded buffer to the queue
  //     audioQueue.current.push(arrayBuffer);

  //     // Start processing queue if not already
  //     if (!isProcessingQueue.current) {
  //       processQueue();
  //     }
  //   } catch (err) {
  //     console.error("Error playing audio response:");
  //     // errorLogger(err, { location: 'AIInterview.playAudioResponse' });
  //   }
  // };

  useEffect(() => {
    setLoader(true);
    fetch("https://central8.dev.sg1.chsh.in/gamification/api/api/games/create-session/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        context: "serious",
        username: localStorage.getItem("user_name"),
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setLoader(false);
        setWebSocketUrl(data.connection_url);
        setScenarioDesc(data?.scenario_description);
        setScenarioTitle(data.scenario_title);
        console.log("Response:", data);
      })
      .catch((err) => {
        console.error("Error:", err);
      });
  }, []);

  useEffect(() => {
    if (state === TEST_STATUS.COMPLETED) {
    setLoader(true);
    fetch("https://central8.dev.sg1.chsh.in/gamification/api/api/games/evaluate/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: localStorage.getItem("user_name"),
      }),
    })
      .then((res) => {
        setLoader(false);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setModalDetails(data)
      })
      .catch((err) => {
        console.error("Error:", err);
      });
    }
  }, [state]);

  useEffect(() => {
    if (botText.current !== infoStates.botText) {
      fetch("https://central8.dev.sg1.chsh.in/gamification/api/api/games/transcript/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: infoStates.botText,
          username: localStorage.getItem("user_name"),
        }),
      })
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
          return res.json();
        })
        .then((data) => {
          console.log("Response:", data);
        })
        .catch((err) => {
          console.error("Error:", err);
        });
      // console.log("infoStates updated:", infoStates);
      botText.current = infoStates.botText;
    }
  }, [infoStates]);

  useEffect(() => {
      fetch("https://central8.dev.sg1.chsh.in/gamification/api/api/games/transcript/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userText,
          username: localStorage.getItem("user_name"),
        }),
      })
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
          return res.json();
        })
        .then((data) => {
          console.log("Response:", data);
        })
        .catch((err) => {
          console.error("Error:", err);
        });
  }, [userText]);
  // Initialize Dhwani connection and handle all websocket/worker events
  // const { sendMessage, isConnected } = useDhwani({
  //   onMessage: async msg => {
  //     const { type, data } = msg;
  //     if (type === 'mark_end') {
  //       setMarkEndData(data);
  //     } else if (data) {
  //       await playAudioResponse(data);
  //     }
  //   },
  //   onConnectionStatusChange: status => {
  //     // if (status) {
  //       // initializeAudio(sendMessage);
  //     // } else {
  //       // cleanupAudio();
  //     // }
  //   },
  // });

  // Keep initialize/cleanup tied to connection flag as before
  // useEffect(() => {
  //   if (isConnected) {
  //     // initializeAudio(sendMessage);
  //   }
  //   return () => {
  //     cleanupAudio();
  //   };
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [isConnected]);

  /**
   * Process audio queue: send `mark` when playback queue drains
   */
  // useEffect(() => {
  //   isDhwaniSpeakingRef.current = isDhwaniSpeaking;

  //   if (
  //     !isDhwaniSpeaking &&
  //     currentlyPlayingQueue.current &&
  //     currentlyPlayingQueue.current.length === 0 &&
  //     markEndData
  //   ) {
  //     sendMessage({ type: 'mark', data: markEndData });
  //     setMarkEndData(null);
  //   }
  // }, [isDhwaniSpeaking, markEndData, sendMessage]);

  useEffect(() => {
    return () => {
      cleanupAudio();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const audioSocketProps = {
    websocketUrl,
    sessionConfig: {
      authToken: "<auth_token>",
      sessionId: "<session_id>",
      initialTestStatus: TEST_STATUS.PAUSED,
      duration: 5 * 60,
    },
    status: state,
    setStatus: () => {},
    isMuted: false,
    setInfoStates,
    setIsCallConcluding: () => {},
    timeLeft: TIME_LEFT_FOR_COMPLETION + 1,
    setIsTryingToReconnect: () => {},
    autoPauseWhenInactive: true,
    setUserText,
  };

  return (
    <>
      {!loader ? (
        <>
          <div className="assistant-container">
            <div className="ai-circle">AI</div>
            <h2 className="assistant-title">Naukri Campus Conversify</h2>
            <div className="tag-buttons">
              <button className="tag-btn">{scenarioTitle}</button>
            </div>
            <p className="assistant-desc">
              {scenarioDesc}
            </p>
            {
              <button
                className="start-btn"
                onClick={() => {
                  state === TEST_STATUS.PAUSED ||
                  state === TEST_STATUS.COMPLETED
                    ? setState(TEST_STATUS.START)
                    : setState(TEST_STATUS.COMPLETED);
                }}
              >
                🎤{" "}
                {state === TEST_STATUS.PAUSED || state === TEST_STATUS.COMPLETED
                  ? "Start Conversify"
                  : "End Conversify"}
              </button>
            }
            <p className="assistant-footer">
              Enhance your skills with AI guidance
            </p>
          </div>

          <AudioSocket {...audioSocketProps} />
          {modalDetails && modalDetails.evaluation && (
            <ConversifyModal
              xpValue={modalDetails.evaluation.xp}
              strengths={modalDetails.evaluation.strengths || "N/A"}
              weakness={modalDetails.evaluation.areas_of_improvement || "N/A"}
              onContinueGaming={() => {
                window.location.href = "/"; // Redirect to home or another page
                setModalDetails(null);
              }}
              onClose={() => {
                window.location.href = "/";
                setModalDetails(null);
              }}
            />
          )}
        </>
      ) : (
        <div className="loader-container">
          <img src={LoaderIcon} />
        </div>
      )}
      {/* <button
        onClick={() => {
          setState(TEST_STATUS.START);
        }}
      >
        Start
      </button> */}
    </>
  );
};

export default GeminiAudioChat;
