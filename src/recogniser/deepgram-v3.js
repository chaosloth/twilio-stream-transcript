//Google Speech to Text
const { createClient, LiveTranscriptionEvents } = require("@deepgram/sdk");

class DeepgramSpeechProvider {
  track = ""; // Name of track e.g. 'inbound', 'outbound'
  recognizeStream = null;

  init = (track, callback, lang = "en-AU") => {
    console.log("STT -> Deepgram > Initializing".green);
    this.track = track;
    // Create the Deepgram client
    this.deepgram = createClient(process.env.DEEPGRAM_API_KEY);

    // this.live = this.deepgram.listen.live({
    //   model: "nova",
    //   language: lang,
    //   smart_format: true,
    //   encoding: "mulaw",
    //   punctuate: true,
    //   interim_results: true,
    //   endpointing: 200,
    //   utterance_end_ms: 1000,
    // });

    this.live = this.deepgram.listen.live({
      model: "nova-2",
      encoding: "mulaw",
      punctuate: true,
      interim_results: true,
      endpointing: 200,
      utterance_end_ms: 1000,
    });

    this.live.on(LiveTranscriptionEvents.Open, () => {
      console.log("STT -> Deepgram connection open".yellow);

      this.live.on(LiveTranscriptionEvents.Close, () => {
        console.log("STT -> Deepgram connection closed".yellow);
      });

      this.live.on(LiveTranscriptionEvents.Error, (error) => {
        console.error("STT -> deepgram error");
        console.error(error);
      });

      this.live.on(LiveTranscriptionEvents.Metadata, (metadata) => {
        console.error("STT -> deepgram metadata");
        console.error(metadata);
      });

      this.live.on(LiveTranscriptionEvents.Warning, (warning) => {
        console.error("STT -> deepgram warning");
        console.error(warning);
      });

      this.live.on(LiveTranscriptionEvents.UtteranceEnd, (data) => {
        console.log("STT -> Deepgram UtteranceEnd".yellow, data);
        let result = {
          track,
          isFinal: data.speech_final,
          text: channel.alternatives.transcript,
        };
        callback(result);
      });

      this.live.on(LiveTranscriptionEvents.Transcript, (data) => {
        console.log("STT -> Deepgram Transcript".yellow, data);
        let result = {
          track,
          isFinal: data.speech_final,
          text: channel.alternatives.transcript,
        };
        callback(result);
      });
    });
  };

  base64ToArrayBuffer(base64) {
    var binaryString = atob(base64);
    var bytes = new Uint8Array(binaryString.length);
    for (var i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  write = (audio) => {
    if (this.live.getReadyState() === 1) {
      this.live.send(this.base64ToArrayBuffer(audio));
    } else {
      // console.log(
      //   "Deepgram > Connection not open, ready state",
      //   this.live.getReadyState()
      // );
    }
  };

  destroy = () => {
    this.live.finish();
  };
}

module.exports = DeepgramSpeechProvider;
