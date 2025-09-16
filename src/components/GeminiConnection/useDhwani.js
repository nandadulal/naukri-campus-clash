import { useEffect, useRef, useState } from 'react';
// import { useSelector, shallowEqual } from 'react-redux';
import WebSocketClient from './websocket';

const VALIDATION_IN_PROGRESS_TIMEOUT = 30000;

const INPUT_SAMPLE_RATE = 44100;
const OUTPUT_SAMPLE_RATE = 16000;

const downsampleBuffer = (buffer, sampleRate, outSampleRate) => {
  if (!buffer || !sampleRate || !outSampleRate) {
    throw new Error('Invalid parameters for downsampling');
  }

  if (outSampleRate === sampleRate) {
    return buffer;
  }

  const sampleRateRatio = sampleRate / outSampleRate;
  const newLength = Math.round(buffer.length / sampleRateRatio);
  const result = new Int16Array(newLength);
  let offsetResult = 0;
  let offsetBuffer = 0;

  while (offsetResult < result.length) {
    const nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio);
    let accum = 0;
    let count = 0;

    for (
      let i = offsetBuffer;
      i < nextOffsetBuffer && i < buffer.length;
      i += 1
    ) {
      accum += buffer[i];
      count += 1;
    }

    result[offsetResult] = Math.min(1, accum / count) * 0x7fff;
    offsetResult += 1;
    offsetBuffer = nextOffsetBuffer;
  }

  return result.buffer;
};

const base64ToArrayBuffer = base64 => {
  if (!base64 || typeof base64 !== 'string') {
    throw new Error('Invalid base64 input');
  }
  const binaryString = atob(base64);
  const { length } = binaryString;
  const buffer = new ArrayBuffer(length);
  const view = new Uint8Array(buffer);

  for (let i = 0; i < length; i += 1) {
    view[i] = binaryString.charCodeAt(i);
  }

  return buffer;
};

/**
 * Custom hook for managing Dhwani WebSocket connection and audio processing
 * Handles websocket connection, worker setup, and audio processing callbacks.
 *
 * @param {Object} options - Configuration options
 * @param {Function} options.onMessage - Callback for handling incoming messages
 * @param {Function} options.onConnectionStatusChange - Callback for connection status changes
 * @param {Function} options.onAudioProcessCallback - Callback for processed audio mean
 * @returns {Object} Dhwani connection interface
 *
 * @example
 * const { sendMessage, isConnected } = useDhwani({
 *   onMessage: (msg) => { ... },
 *   onConnectionStatusChange: (status) => { ... },
 *   onAudioProcessCallback: (mean) => { ... }
 * });
 */
const useDhwani = ({
  onMessage,
  onConnectionStatusChange,
  // onAudioProcessCallback,
}) => {
  const [isConnected, setIsConnected] = useState(false);
  // const [manualDisconnect, setManualDisconnect] = useState(false);
  const [error, setError] = useState(null);

  const wsRef = useRef(null);
  // const workerRef = useRef(null);
  // const validationInProgressRef = useRef(false);
  // const validationInProgressTimeoutRef = useRef(null);

  // const dispatch = useDispatch();
  // const {
  //   interviewSession,
  //   // testSlug,
  //   // testSolutionId,
  //   // validateDhwaniInterviewSession,
  // } = useSelector(
  //   state => ({
  //     interviewSession: state.aiInterview.interviewSession,
  //   }),
  //   shallowEqual
  // );


  const handleWsClose = () => {
    console.log("WebSocket connection closed");
    // if (!manualDisconnect) {
    //   if (!validationInProgressRef.current) {
    //     validationInProgressRef.current = true;
    //     dispatch({
    //       type: ActionTypes.VALIDATE_DHWANI_INTERVIEW_SESSION,
    //       payload: { test_slug: testSlug, test_solution_id: testSolutionId },
    //     });
    //   } else if (wsRef.current) {
    //     wsRef.current.handleReconnect();
    //   }
    // }
  };

  // const handleToast = (type, apiStatus, apiValue) => {
  //   const errorInfo = getApiErrorData(
  //     {
  //       response: {
  //         status: apiStatus,
  //       },
  //     },
  //     apiValue
  //   );
  //   if (errorInfo && errorInfo.message) {
  //     if (type === 'info') {
  //       dispatch(showInfoToast(errorInfo.message));
  //     } else {
  //       dispatch(showErrorToast(errorInfo.message, errorInfo.apiErrorInfo));
  //     }
  //   }
  // };

  // On mount, fetch interview session if not present
  // useEffect(() => {
  //   if (
  //     (!interviewSession ||
  //       (validateDhwaniInterviewSession?.data &&
  //         validateDhwaniInterviewSession?.data?.is_session_expired)) &&
  //     testSlug &&
  //     testSolutionId
  //   ) {
  //     dispatch({
  //       type: ActionTypes.GET_INTERVIEW_SESSION,
  //       payload: { test_slug: testSlug, test_solution_id: testSolutionId },
  //     });
  //   }
  //   if (
  //     validateDhwaniInterviewSession?.data &&
  //     !validateDhwaniInterviewSession?.data?.is_session_expired &&
  //     wsRef.current
  //   ) {
  //     wsRef.current.handleReconnect();
  //   }
  //   handleValidationProgressTimeout();
  // }, [validateDhwaniInterviewSession?.data, testSlug, testSolutionId]);

  // (Re)connect websocket whenever interviewSession.connection_url changes
  useEffect(() => {
    const wsUrl = 'wss://dhwani.naukri.com/dhwani-realtime-services/websocket/v2/connect?service_type=RealTimeWeb&user_session_config_id=68a872544e5fab040a4bf695&auth_token=coD4pj5R6G6tPusNoPrSukPsLoEgk3bvwQSsQIRg'
    if (!wsUrl) {
      if (wsRef.current) {
        wsRef.current.disconnect();
        wsRef.current = null;
      }
      return undefined;
    }
    setError(null);
    if (wsRef.current) {
      wsRef.current.disconnect();
      wsRef.current = null;
    }
    wsRef.current = new WebSocketClient(wsUrl, {
      onCloseCB: () => {
        handleWsClose();
      },
      errorCB: type => {
        console.error("WebSocket error:", type);
        // if (type === 'reconnectError') {
        //   handleToast('error', 'DRE', 'DWS');
        // }
      },
      onReconnectCB: () => {
        console.log("WebSocket reconnecting");
        // handleToast('info', 'DRI', 'DWS');
      },
    });
    // WebSocket message handler
    wsRef.current.onMessageCBHandler(data => {
      let processedData;
      switch (data.type) {
        case 'stream_response':
          processedData = base64ToArrayBuffer(data);
          processedData = new Uint8Array(processedData);
          if (onMessage) {
              onMessage({
                type: 'processedAudioFromWebsocket',
                data: processedData,
                origin,
              });
          }
          break;
        case 'mark_end':
          if (onMessage) {
            onMessage({
              type: 'mark_end',
              data: data.data,
              origin: data.origin,
            });
          }
          break;
        default:
          // Optionally handle other message types here
          break;
      }
    });
    // WebSocket connection status handler
    wsRef.current.onConnectionStatusChange = status => {
      setIsConnected(status);
      if (onConnectionStatusChange) {
        onConnectionStatusChange(status);
      }
    };
    wsRef.current.connect();
    // handleValidationProgressTimeout();
    setIsConnected(true);
    return () => {
      if (wsRef.current) {
        wsRef.current.disconnect();
        wsRef.current = null;
      }
    };
  }, []);


  /**
   * Disconnects from the WebSocket and cleans up resources
   */
  const disconnect = () => {
    if (wsRef.current) {
      try {
        wsRef.current.disconnect();
        wsRef.current = null;
        setIsConnected(false);
        // setManualDisconnect(true);
        if (onConnectionStatusChange) {
          onConnectionStatusChange(false);
        }
      } catch (err) {
        console.error("Error during WebSocket disconnection:", err);
        // errorLogger(err, { location: 'useDhwani.disconnect' });
        // setError('Failed to disconnect properly');
      }
    }
  };

  /**
   * Sends a message through the WebSocket connection or to the worker.
   * Handles user audio, Dhwani audio, and control messages.
   * @param {Object} message - The message to send
   */
  const sendMessage = message => {
    try {
      if (!wsRef.current) {
        throw new Error(' WebSocket not initialized');
      }
      let audioBuffer = null;
      let base64Data = null;
      switch (message.type) {
        case 'audio_stream':
          audioBuffer = downsampleBuffer(
            message.data,
            INPUT_SAMPLE_RATE,
            OUTPUT_SAMPLE_RATE
          );
          base64Data = btoa(
            String.fromCharCode(...new Uint8Array(audioBuffer))
          );
          if (wsRef.current && wsRef.current.isConnected) {
            wsRef.current.send({ type: 'audio_stream', data: base64Data });
          }
          break;
        case 'mark':
        case 'pause':
        default:
          wsRef.current.send(JSON.stringify(message));
          break;
      }
    } catch (err) {
      console.error("Error sending message:", err);
      // errorLogger(err, { location: 'useDhwani.sendMessage' });
      // setError('Failed to send message');
    }
  };

  return {
    isConnected,
    error,
    sendMessage,
    disconnect,
  };
};

export default useDhwani;
