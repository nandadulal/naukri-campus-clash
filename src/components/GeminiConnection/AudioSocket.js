import React from 'react';
import { useEffect, useRef, useState } from 'react';
import {
    AUDIO_INPUT_MIN_AMP,
    INITIAL_STATES,
    INTERVALS,
    INTERVIEW_END_TYPES,
    TEST_STATUS,
    TIME_LEFT_FOR_COMPLETION,
    WEB_SOCKET_CONFIG
} from './constants.js';
import { base64ToArrayBuffer, downsampleBuffer, generateSilence } from './utils';
import AudioPlayer from './AudioPlayer';
const AudioSocket = props => {
    const {
        sessionConfig = {},
        websocketUrl = "",
        status = TEST_STATUS.PAUSED ,
        setStatus = noop,
        isMuted = false,
        setInfoStates = noop,
        setIsCallConcluding = noop,
        timeLeft = 0,
        setIsTryingToReconnect = noop,
        autoPauseWhenInactive = true,
        setUserText,
    } = props;

    // const [userText, setUserText] = useState('');
    const [userAudioAmp, setUserAudioAmp] = useState(0);
    const [sessionId, setSessionId] = useState('');
    const [authToken, setAuthToken] = useState('');

    const [isTimerCompleted, setIsTimerCompleted] = useState(false);
    const [audioPackets, setAudioPackets] = useState([]);
    const [isBotSpeaking, setIsBotSpeaking] = useState(false);
    const [botText, setBotText] = useState('');
    const [currentBotTurn, setCurrentBotTurn] = useState(INITIAL_STATES.CURRENT_BOT_TURN);

    const [endInterviewType, setInterviewEndType] = useState(null);

    const socketRef = useRef(null);
    const socketRetriesRef = useRef(INITIAL_STATES.SOCKET_RETRIES);
    const audioRecorderRef = useRef(null);
    const audioPlayerRef = useRef(null);
    const retryTimerRef = useRef(null);

    const interviewCompletedRef = useRef(false);

    const stateRef = useRef({});

    const isCurrentBotTurn = currentBotTurn !== INITIAL_STATES.CURRENT_BOT_TURN;
    const isSoundAmp = userAudioAmp >= AUDIO_INPUT_MIN_AMP;

    // console.log('Client side states: ',{ botText, currentBotTurn, isBotSpeaking });

    const recordAudio = () => {
        if (audioRecorderRef.current) {
            return;
        }

        const context = new (window.AudioContext || window.webkitAudioContext)({
            latencyHint: 'interactive'
        });
        const processor = context.createScriptProcessor(4096, 1, 1);
        processor.connect(context.destination);

        const handleSuccess = stream => {
            const input = context.createMediaStreamSource(stream);
            input.connect(processor);
            audioRecorderRef.current = stream;

            processor.onaudioprocess = e => {
                if (stateRef.current.isMuted) {
                    sendMessage(WEB_SOCKET_CONFIG.MSG_TYPES.AUDIO_STREAM, generateSilence());
                    if (stateRef.current.userAudioAmp) {
                        setUserAudioAmp(0);
                    }
                    return;
                }

                const left = e.inputBuffer.getChannelData(0);
                const left16 = downsampleBuffer(left, 44100, 16000);

                if (!stateRef.current.isCurrentBotTurn && stateRef.current.botText) {
                    let rms = 0;
                    for (let i = 0; i < left.length; i++) {
                        rms += left[i] * left[i]; // Square each sample
                    }
                    rms = Math.sqrt(rms / left.length); // Take the square root of the average of the squared samples
                    setUserAudioAmp(rms);
                }

                // Convert bytes to base64
                const base64Data = btoa(String.fromCharCode(...new Uint8Array(left16))); // Use Uint8Array for compatibility

                // Send base64 data through WebSocket
                sendMessage(WEB_SOCKET_CONFIG.MSG_TYPES.AUDIO_STREAM, base64Data);
            };
        };

        navigator.mediaDevices
            .getUserMedia({
                audio: { echoCancellation: true, noiseSuppression: true },
                video: false
            })
            .then(handleSuccess);
    };

    const playAudio = chunk => {
        setIsBotSpeaking(true);
        if (audioPlayerRef.current) {
            audioPlayerRef.current.clear();
        } else {
            audioPlayerRef.current = new AudioPlayer();
            audioPlayerRef.current.on_stop(() => setIsBotSpeaking(false));
        }
        audioPlayerRef.current.feed(chunk);
    };

    const stopAudio = () => {
        if (audioPlayerRef.current) {
            audioPlayerRef.current.stop();
            setIsBotSpeaking(false);
        }
    };

    const stopRecorder = () => {
        if (audioRecorderRef.current) {
            audioRecorderRef.current.getTracks?.().forEach(track => track.stop());
        }
    };
    const runStaticBuffer = () => {
        console.log('Running static buffer...', bufferList);
        let convertedBufferList = [];
        convertedBufferList = bufferList.map((bufferData, index) => {
            const { text, bot_turn, audio } = bufferData.data || {};
            console.log(bufferData, index, audio);
            const audio_buffer = base64ToArrayBuffer(audio);
            // setAudioPackets(prev => [...prev, { text, audio: audio_buffer, bot_turn }]);
            return { text, audio: audio_buffer, bot_turn };
        });
        setAudioPackets(convertedBufferList);
    }
    const connectWebSocket = () => {
        if (socketRef.current) {
            return;
        }

        if (socketRetriesRef.current >= WEB_SOCKET_CONFIG.MAX_RETRIES) {
            console.log('Max retry limit reached. Stopping attempts.');
            return;
        }

        console.log(
            `WebSocket attempt ${socketRetriesRef.current + 1}/${WEB_SOCKET_CONFIG.MAX_RETRIES}`
        );

        socketRef.current = new WebSocket(websocketUrl);

        // socketRef.current = new WebSocket(
        //     `wss://dhwani.naukri.com/dhwani-realtime-services/websocket/v2/connect?service_type=RealTimeWeb&user_session_config_id=68a8acae914281e132bdb197&auth_token=ka5pijULEd9iP7CAiYlTAzR625tIGaL0XC2FyfFj`
        // );

        socketRef.current.onopen = () => {
            console.log('Connected to WebSocket server');
            recordAudio();
        };

        socketRef.current.onmessage = event => {
            if (socketRetriesRef.current) {
                socketRetriesRef.current = INITIAL_STATES.SOCKET_RETRIES; // Reset retry count on successful connection
                setIsTryingToReconnect(false);
            }
            // console.log(`Message from server: ${event.data}`);
            const data = JSON.parse(event.data);
            const { type } = data || {};
            switch (type) {
                case WEB_SOCKET_CONFIG.EVENTS.STREAM_RESPONSE:
                    const { text, bot_turn, audio } = data?.data || {};
                    const audio_buffer = base64ToArrayBuffer(audio);
                    setAudioPackets(prev => [...prev, { text, audio: audio_buffer, bot_turn }]);

                    console.log(
                        `Message from server: ${data.type}:${JSON.stringify({ text, bot_turn })}`
                    );
                    return;
                case WEB_SOCKET_CONFIG.EVENTS.USER_TRANSCRIPTS:
                    setUserText(prev => (data?.data || ''));
                    console.log(`Message from server: ${data.type}:${JSON.stringify(data.data)}`);
                    return;
                case WEB_SOCKET_CONFIG.EVENTS.MAX_USER_SILENCE:
                    setStatus(TEST_STATUS.PAUSED);
                    console.log(`Message from server: ${data.type}:${JSON.stringify(data.data)}`);
                    return;
                default:
                    console.log(`Message from server: ${data.type}:${JSON.stringify(data.data)}`);
                    return;
            }
        };

        socketRef.current.onclose = event => {
            console.log(`WebSocket closed. Code: ${event.code}, Reason: ${event.reason}`);
            socketRef.current = null;

            if (event.code === 1000 && !stateRef.current.isTimerCompleted) {
                // Detect abrupt successful completion
                setStatus(TEST_STATUS.COMPLETED);
            }

            if (event.code === 1006) {
                // Detect network failure
                socketRetriesRef.current++;
                setIsTryingToReconnect(true);
                // console.log(`Retrying in ${WEB_SOCKET_CONFIG.RETRY_INTERVAL / 1000} seconds...`);
                clearRetryTimer();
                retryTimerRef.current = setTimeout(
                    connectWebSocket,
                    WEB_SOCKET_CONFIG.RETRY_INTERVAL
                );
            }
        };

        socketRef.current.onerror = error => {
            console.error('WebSocket error:', error);
            socketRef.current.close(); // Triggers `onclose`
        };
    };

    const sendMessage = (type, data) => {
        if (socketRef.current && socketRef.current.readyState === WEB_SOCKET_CONFIG.STATES.OPEN) {
            // socket open
            socketRef.current.send(JSON.stringify({ type, data }));
            if (type !== 'audio_stream') {
                console.log('Message from client: ', { type, data });
            }
        }
    };

    const disconnectSocket = () => {
        if (socketRef.current) {
            socketRef.current.close();
        }
    };

    const clearRetryTimer = () => {
        if (retryTimerRef.current) {
            clearTimeout(retryTimerRef.current);
        }
    };
    const resetStates = () => {
        setUserText('');
        setAudioPackets([]);
        setIsBotSpeaking(false);
        setBotText('');
        setCurrentBotTurn(INITIAL_STATES.CURRENT_BOT_TURN);
        // clearMuteTimer();
    };

    useEffect(() => {
        if (sessionConfig?.sessionId) {
            setSessionId(sessionConfig.sessionId);
            setAuthToken(sessionConfig.authToken);
            setStatus(sessionConfig.initialTestStatus);
        }
    }, []);

    useEffect(() => {
        stateRef.current = {
            isCurrentBotTurn,
            botText,
            isMuted,
            isTimerCompleted,
            userAudioAmp
        };
    }, [currentBotTurn, botText, isMuted, isTimerCompleted, userAudioAmp]);

    useEffect(() => {
        setInfoStates({
            isCurrentBotTurn,
            botText,
            isMicAudioDetected: isSoundAmp
        });
    },[currentBotTurn, botText, userAudioAmp]);

    useEffect(() => {
        return () => {
            disconnectSocket();
            stopAudio();
            stopRecorder();
            clearRetryTimer();
        };
    }, []);

    useEffect(() => {
        if (status !== TEST_STATUS.START) {
            return;
        }
        if (!isBotSpeaking && audioPackets.length) {
            const [newPacket, ...remainingPackets] = audioPackets;
            playAudio(newPacket.audio);
            if (currentBotTurn === newPacket.bot_turn) {
                setBotText(prev => prev + newPacket.text);
            } else {
                setBotText(newPacket.text);
                setCurrentBotTurn(newPacket.bot_turn);
            }
            setAudioPackets(remainingPackets);
        } else if (!isBotSpeaking && !audioPackets.length) {
            if (INTERVIEW_END_TYPES.NORMAL === endInterviewType) {
                setInterviewEndType(INTERVIEW_END_TYPES.EXTENDED);
            }
            if (isTimerCompleted) {
                setStatus(TEST_STATUS.COMPLETED);
                return;
            }
            if (isCurrentBotTurn) {
                sendMessage(WEB_SOCKET_CONFIG.MSG_TYPES.MARK, currentBotTurn);
                setCurrentBotTurn(INITIAL_STATES.CURRENT_BOT_TURN);
            }
        }
    }, [isBotSpeaking, audioPackets, isTimerCompleted, status, endInterviewType]);

    const storeAudioBuffer = (audioBuffer) => {

    }
    useEffect(() => {
        switch (status) {
            case TEST_STATUS.START:
                if (interviewCompletedRef.current) {
                    setStatus(TEST_STATUS.COMPLETED);
                    return;
                }
                // console.log('Connecting to WebSocket...', bufferList);
                // runStaticBuffer();
                connectWebSocket();
                return;
            case TEST_STATUS.PAUSED:
                stopAudio();
                sendMessage(WEB_SOCKET_CONFIG.MSG_TYPES.PAUSE, true);
                setTimeout(() => {
                    disconnectSocket();
                }, 10);
                resetStates();
                return;
            case TEST_STATUS.COMPLETED:
                disconnectSocket();
                return;
        }
    }, [status]);

    useEffect(() => {
        if (!autoPauseWhenInactive) {
            return;
        }
        
        if (status !== TEST_STATUS.START) {
            return;
        }

        const handleVisibility = () => {
            if (document.hidden) {
                setStatus(TEST_STATUS.PAUSED);
            }
        };

        window.addEventListener('visibilitychange', handleVisibility);
        return () => {
            window.removeEventListener('visibilitychange', handleVisibility);
        };
    }, [status]);

    const markInterviewComplete = () => {
        sendMessage(WEB_SOCKET_CONFIG.MSG_TYPES.COMPLETED, true);
        setTimeout(() => setIsTimerCompleted(true), 2000);
    };

    useEffect(() => {
        if (
            status === TEST_STATUS.PAUSED ||
            isSoundAmp ||
            endInterviewType !== INTERVIEW_END_TYPES.EXTENDED ||
            isCurrentBotTurn
        ) {
            return;
        }

        const timer = setTimeout(
            markInterviewComplete,
            INTERVALS.EXTENDTED_INTERVIEW_SILENCE_DURATION * 1000
        );

        return () => {
            if (timer) {
                clearTimeout(timer);
            }
        };
    }, [endInterviewType, status, isSoundAmp, isCurrentBotTurn]);
    

    useEffect(() => {
        if (
            status === TEST_STATUS.PAUSED ||
            endInterviewType !== INTERVIEW_END_TYPES.EXTENDED ||
            isCurrentBotTurn
        ) {
            return;
        }

        const timer = setTimeout(
            markInterviewComplete,
            INTERVALS.EXTENDED_INTERVIEW_DURATION * 1000
        );
        return () => {
            if (timer) {
                clearTimeout(timer);
            }
        };
    }, [endInterviewType, status, isCurrentBotTurn]);

    useEffect(() => {
        if (
            timeLeft <= TIME_LEFT_FOR_COMPLETION &&
            !interviewCompletedRef.current
        ) {
            if (isCurrentBotTurn) {
                setInterviewEndType(INTERVIEW_END_TYPES.NORMAL);
            } else {
                setInterviewEndType(INTERVIEW_END_TYPES.EXTENDED);
            }
            interviewCompletedRef.current = true;
            setIsCallConcluding(true);
        }
    }, [timeLeft]);

    return null;
};

export default AudioSocket;
