class AudioPlayer {
    constructor() {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.currentAudioTime = this.audioContext.currentTime; // Tracks when the next chunk will play
      this.totalResponseDuration = 0; // Total duration of the current response
      this.isPlaying = false; // Whether audio is currently playing
      this.audioQueue = []; // Queue to hold audio buffers
      this.stopCallback = null; // Callback to call when audio stops
      this.playCallback = null; // Callback to call when audio starts
    }
  
    // Feed: Adds audio to the queue
    feed(arrayBuffer) {
      this.audioQueue.push(arrayBuffer);
      if (!this.isPlaying) {
        // console.log("Playing again!")
        this.play(); // Start playing if not already
      }
    }
  
    // Play: Starts playing audio
    play() {
      if (this.audioQueue.length === 0 || this.isPlaying) {
        return; // Nothing to play or already playing
      }
      this.isPlaying = true;
  
      if (this.playCallback) {
        this.playCallback(); // Call the on_play callback when playback starts
      }
  
      const processNextChunk = () => {
        if (this.audioQueue.length === 0) {
          this.isPlaying = false;
          if (this.stopCallback) {
            this.stopCallback(); // Call the on_stop callback when all audio stops
          }
          return;
        }
  
        const arrayBuffer = this.audioQueue.pop();
        this.audioContext.decodeAudioData(
          arrayBuffer,
          (decodedData) => {
            const source = this.audioContext.createBufferSource();
            source.buffer = decodedData;
  
            // Connect the source to the destination
            source.connect(this.audioContext.destination);
  
            // Schedule playback based on the current time
            const nextPlaybackTime = Math.max(
              this.audioContext.currentTime,
              this.currentAudioTime
            );
            source.start(nextPlaybackTime);
  
            // Update the currentAudioTime for the next chunk
            this.currentAudioTime = nextPlaybackTime + decodedData.duration;
  
            // Track total response duration
            this.totalResponseDuration += decodedData.duration;
  
            source.onended = () => {
              this.totalResponseDuration -= decodedData.duration;
  
              // Continue with the next chunk
              processNextChunk();
            };
          },
          (error) => {
            console.error("Error decoding audio chunk:", error);
            processNextChunk(); // Skip this chunk and process the next
          }
        );
      };
  
      processNextChunk(); // Start processing the queue
    }
  
    // Stop: Stops all audio playback
    stop() {
      if (this.audioContext.state === "running") {
        this.audioContext.suspend();
      }
      this.isPlaying = false;

      if (this.stopCallback) {
        this.stopCallback()
      }
    }
  
    // Clear: Clears the audio queue
    clear() {
      this.audioQueue = []; // Clear the queue
      this.currentAudioTime = 0; // Reset the current audio time
      this.totalResponseDuration = 0; // Reset the total response duration
      this.isPlaying = false; // Reset the playback state
    
      // Close the existing audio context
      if (this.audioContext) {
        const old = this.audioContext;
        old.suspend();
        old.close().then(() => {
          // Create a new audio context if needed
          // this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }).catch((error) => {
          console.error("Error closing audio context:", error);
        });
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.currentAudioTime = this.audioContext.currentTime; // Reset the audio time
      }
    }
  
    // on_stop: Sets a callback function to be called when all audio stops playing
    on_stop(callback) {
      this.stopCallback = callback;
    }
  
    // on_play: Sets a callback function to be called when audio starts playing
    on_play(callback) {
      this.playCallback = callback;
    }
  }
  
  export default AudioPlayer;
  