//Google Speech to Text
const { Deepgram } = require("@deepgram/sdk");

class DeepgramSpeechProvider {
  track = ""; // Name of track e.g. 'inbound', 'outbound'
  recognizeStream = null;

  init = (track, callback, lang = "en-AU") => {
    console.log("STT -> Deepgram > Initializing".green);
    this.destroyed = false;
    this.track = track;
    this.finalResult = "";
    // Create the Deepgram client
    const deepgram = new Deepgram(process.env.DEEPGRAM_API_KEY);
    this.deepgramLive = deepgram.transcription.live({
      encoding: "mulaw",
      sample_rate: "8000",
      model: "nova-2",
      punctuate: true,
      interim_results: true,
      endpointing: 200,
      utterance_end_ms: 1000,
      language: lang,
    });

    this.deepgramLive.addListener("error", (error) => {
      console.error("STT -> deepgram error", error);
    });

    this.deepgramLive.addListener("warning", (warning) => {
      console.error("STT -> deepgram warning", warning);
    });

    this.deepgramLive.addListener("metadata", (metadata) => {
      console.error("STT -> deepgram metadata", metadata);
    });

    this.deepgramLive.addListener("close", () => {
      console.log("STT -> Deepgram connection closed");
    });

    this.deepgramLive.addListener(
      "transcriptReceived",
      (transcriptionMessage) => {
        const transcription = JSON.parse(transcriptionMessage);

        // console.log("STT -> Deepgram transcriptReceived", transcription);

        let text = "";
        if (transcription.channel?.alternatives) {
          text = transcription.channel?.alternatives[0]?.transcript;
        }

        // if we receive an UtteranceEnd and speech_final has not already happened then we should consider this the end of of the human speech and emit the transcription
        if (transcription.type === "UtteranceEnd") {
          if (!this.speechFinal) {
            console.log(
              `UtteranceEnd received before speechFinal, emit the text collected so far: ${this.finalResult}`
            );
            if (!this.destroyed)
              callback({
                track,
                isFinal: false,
                text: this.finalResult,
              });
            return;
          } else {
            console.log(
              "STT -> Speech was already final when UtteranceEnd recevied"
            );
            return;
          }
        }

        // if is_final that means that this chunk of the transcription is accurate and we need to add it to the finalResult
        if (transcription.is_final === true && text.trim().length > 0) {
          this.finalResult += ` ${text}`;
          // if speech_final and is_final that means this text is accurate and it's a natural pause in the speakers speech. We need to send this to the assistant for processing
          if (transcription.speech_final === true) {
            this.speechFinal = true; // this will prevent a utterance end which shows up after speechFinal from sending another response
            try {
              if (!this.destroyed)
                callback({
                  track,
                  isFinal: transcription.speech_final,
                  text: this.finalResult,
                });
            } catch (err) {
              console.error("STT -> Error sending transcript", err);
            }
            this.finalResult = "";
          } else {
            // if we receive a message without speechFinal reset speechFinal to false, this will allow any subsequent utteranceEnd messages to properly indicate the end of a message
            this.speechFinal = false;
          }
        } else {
          try {
            console.log(`STT -> Deepgram Utterance  ${track} > ${text}`, text);
            if (text.trim().length > 0)
              if (!this.destroyed)
                callback({
                  track,
                  isFinal: false,
                  text: text,
                });
          } catch (err) {
            console.error("Error sending transcript", err);
          }
        }
      }
    );
  };

  write = (audio) => {
    if (this.deepgramLive.getReadyState() === 1) {
      this.deepgramLive.send(Buffer.from(audio, "base64"));
    }
  };

  destroy = () => {
    this.destroyed = true;
    this.deepgramLive.finish();
  };
}

module.exports = DeepgramSpeechProvider;
