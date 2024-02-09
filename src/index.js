// Common parts
const env = require("dotenv").config();

// Media Streams part
const WebSocket = require("ws");
const express = require("express");
const app = express();
const server = require("http").createServer(app);
const wssMediaStream = new WebSocket.Server({ server });
const SPEECH_PROVIDER_NAME = "microsoft"; // Providers are "microsoft" or "google" or "deepgram"

// Speech to Text Service
const { createRecognizer } = require("./recogniser");

// Twilio parts
try {
  const { syncClient } = require("./syncService");

  const createCall = async (callSid) => {
    if (syncClient.connectionState != "connected") {
      console.warn(
        `Sync client not connected, unable to create call ${callSid}`
      );
      return null;
    }

    console.log(`Attempting to create stream for call ${callSid}`);

    return syncClient
      .stream({
        id: "FLEX_ASSIST_" + callSid,
        mode: "open_or_create",
        ttl: 3600,
      })
      .then((stream) => {
        console.log(
          `Created new sync stream for call: ${callSid} with stream SID: ${stream.sid}`
        );
        return stream;
      })
      .catch((err) => {
        console.warn(`Error creating stream for call ${callSid}`, err);
        return null;
      });
  };

  // Handle Web Socket Connection for Media Stream
  wssMediaStream.on("connection", function connection(ws) {
    console.log("New Connection Initiated");

    let flexStream = null;
    // let speechProvider = new GoogleSpeechProvider();
    let speechRecognizers = {};

    ws.on("message", async function incoming(message) {
      const msg = JSON.parse(message);
      switch (msg.event) {
        case "connected":
          console.log(`A new call has connected.`, msg);

          break;
        case "start":
          console.log(`Starting Media Stream ${msg.streamSid}`);
          console.log(`Start Meta`, msg);
          // Create Stream for Twilio Flex
          flexStream = await createCall(msg.start.callSid);

          let lang = msg.start?.customParameters?.lang;

          // Create a speech recognizer per track
          msg.start.tracks.map((trackName) => {
            speechRecognizers[trackName] =
              createRecognizer(SPEECH_PROVIDER_NAME);
            speechRecognizers[trackName].init(
              trackName,
              (data) => {
                try {
                  flexStream.publishMessage(data);
                } catch (err) {
                  console.log("Error writing to Sync stream", err);
                }
              },
              lang
            );
          });
          break;

        case "media":
          // Write Media Packets to the recognize stream
          if (speechRecognizers[msg.media.track])
            speechRecognizers[msg.media.track].write(msg.media.payload);
          break;

        case "stop":
          console.log(`Call Has Ended`);
          try {
            for (var track in speechRecognizers) {
              console.log(
                `Attempting to destroy recognizer for track: ${track}`
              );
              if (speechRecognizers[track]) {
                console.log(
                  `Found recognizer for track: ${track}, now calling destroy()`
                );
                speechRecognizers[track].destroy();
              }
            }
            if (flexStream !== null) {
              setTimeout(() => flexStream.removeStream(), 5000);
            }
          } catch (err) {
            console.warn("Error closing streams", err);
          }
          break;
      }
    });
  });

  //Handle HTTP Request
  app.get("/", (req, res) => res.send("Media Stream Thingy"));

  console.log("Listening at Port 8080");
  server.listen(8080);
} catch (err) {
  console.error("Sync client error", error);
}
