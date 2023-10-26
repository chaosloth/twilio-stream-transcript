//Google Speech to Text
const speech = require("@google-cloud/speech");
const speechClient = new speech.SpeechClient();

//Configure Transcription Request
const streamingRequest = {
  config: {
    encoding: "MULAW",
    sampleRateHertz: 8000,
    languageCode: "en-AU",
  },
  interimResults: true,
};

class GoogleSpeechProvider {
  track = ""; // Name of track e.g. 'inbound', 'outbound'
  recognizeStream = null;

  init = (track, callback) => {
    this.track = track;
    // Create Stream to the Google Speech to Text API
    this.recognizeStream = speechClient
      .streamingRecognize(streamingRequest)
      .on("error", console.error)
      .on("data", (data) => {
        let transcript = "";
        data.results.map((r) => (transcript += r.alternatives[0].transcript));

        let result = {
          track,
          isFinal: data.results[0].isFinal,
          text: transcript,
        };

        callback(result);
      });
  };

  write = (audio) => {
    this.recognizeStream.write(audio);
  };

  destroy = () => {
    this.recognizeStream.destroy();
  };
}

module.exports = GoogleSpeechProvider;
