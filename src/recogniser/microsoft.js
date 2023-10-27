//Microsoft Speech to Text
const sdk = require("microsoft-cognitiveservices-speech-sdk");

class MicrosoftSpeechProvider {
  track = ""; // Name of track e.g. 'inbound', 'outbound'

  audioFormat = sdk.AudioStreamFormat.getWaveFormat(
    8000, // samplesPerSecond
    8, // bitsPerSample
    1, // channels
    sdk.AudioFormatTag.MuLaw // Format
  );
  pushStream = sdk.AudioInputStream.createPushStream(this.audioFormat);
  audioConfig = sdk.AudioConfig.fromStreamInput(this.pushStream);
  speechConfig = null;
  speechRecognizer = null;

  init = (track, callback, lang = "en-AU") => {
    this.track = track;
    this.speechConfig = sdk.SpeechConfig.fromSubscription(
      process.env.MS_SPEECH_KEY,
      process.env.MS_SPEECH_REGION
    );

    this.speechConfig.speechRecognitionLanguage = lang; // Set the language if available
    this.speechRecognizer = new sdk.SpeechRecognizer(
      this.speechConfig,
      this.audioConfig
    );

    this.speechRecognizer.recognizing = (s, e) => {
      console.log(`RECOGNIZING:  ${track} >> (${e.result.text})`);
      callback({
        track,
        isFinal: false,
        text: e.result.text,
      });
    };

    this.speechRecognizer.recognized = (s, e) => {
      if (e.result.reason == sdk.ResultReason.RecognizedSpeech) {
        console.log(`RECOGNIZED: ${track} >> ${e.result.text}`);
        callback({
          track,
          isFinal: true,
          text: e.result.text,
        });
      } else if (e.result.reason == sdk.ResultReason.NoMatch) {
        console.log("NOMATCH: Speech could not be recognized.");
      }
    };

    this.speechRecognizer.canceled = (s, e) => {
      console.log(`CANCELED: Reason=${e.reason}`);

      if (e.reason == sdk.CancellationReason.Error) {
        console.log(`"CANCELED: ErrorCode=${e.errorCode}`);
        console.log(`"CANCELED: ErrorDetails=${e.errorDetails}`);
        console.log(
          "CANCELED: Did you set the speech resource key and region values?"
        );
      }

      this.speechRecognizer.stopContinuousRecognitionAsync();
    };

    this.speechRecognizer.sessionStopped = (s, e) => {
      console.log("Session stopped event.");
      this.speechRecognizer.stopContinuousRecognitionAsync();
    };

    this.speechRecognizer.startContinuousRecognitionAsync(() => {
      console.log("Continuous Speech recognizer started");
    });

    console.log(`Created new Microsoft Speech Recognizer for track: ${track}`);
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
    this.pushStream.write(this.base64ToArrayBuffer(audio));
    // console.log("Audio type", typeof audio);
  };

  destroy = () => {
    this.pushStream.close();
    this.speechRecognizer.stopContinuousRecognitionAsync();
  };
}

module.exports = MicrosoftSpeechProvider;
