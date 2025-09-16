export const TEST_STATUS = {
    START: 'START',
    PAUSED: 'PAUSED',
    COMPLETED: 'COMPLETED'
};

export const INTERVALS = {
    EXTENDED_INTERVIEW_DURATION: 30, // secs
    EXTENDTED_INTERVIEW_SILENCE_DURATION: 2 // secs
};

export const WEB_SOCKET_CONFIG = {
    MAX_RETRIES: 5,
    RETRY_INTERVAL: 4000,
    EVENTS: {
        STREAM_RESPONSE: 'stream_response',
        USER_TRANSCRIPTS: 'user_transcripts',
        MAX_USER_SILENCE: 'max_user_silence_detected'
    },
    MSG_TYPES: {
        AUDIO_STREAM: 'audio_stream',
        MARK: 'mark',
        PAUSE: 'pause',
        COMPLETED: 'completed'
    },
    STATES:{
        OPEN: 1
    }
};

export const INITIAL_STATES = {
    SOCKET_RETRIES: 0,
    CURRENT_BOT_TURN: 0
};

export const AUDIO_INPUT_MIN_AMP = 0.01;

export const TIME_LEFT_FOR_COMPLETION = 2;

export const INTERVIEW_END_TYPES = {
    NORMAL: 'normal',
    EXTENDED: 'extended'
};
