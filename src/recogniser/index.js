const GoogleSpeechProvider = require("./google");
const MicrosoftSpeechProvider = require("./microsoft");

module.exports = {
  createRecognizer(provider) {
    switch (provider) {
      case "google":
        return new GoogleSpeechProvider();
      case "microsoft":
        return new MicrosoftSpeechProvider();
      default:
        throw `Error no such provider: ${provider}`;
    }
  },
};
