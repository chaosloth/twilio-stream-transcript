const GoogleSpeechProvider = require("./google");
const MicrosoftSpeechProvider = require("./microsoft");
const DeepgramSpeechProvider = require("./deepgram-v2");

module.exports = {
  createRecognizer(provider) {
    switch (provider) {
      case "google":
        return new GoogleSpeechProvider();
      case "microsoft":
        return new MicrosoftSpeechProvider();
      case "deepgram":
        return new DeepgramSpeechProvider();
      default:
        throw `Error no such provider: ${provider}`;
    }
  },
};
