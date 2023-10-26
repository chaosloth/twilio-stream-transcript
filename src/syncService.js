const Twilio = require("twilio");
const { SyncClient } = require("twilio-sync");

const AccessToken = Twilio.jwt.AccessToken;
const SyncGrant = AccessToken.SyncGrant;

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const apiKey = process.env.TWILIO_API_KEY;
const apiSecret = process.env.TWILIO_API_SECRET;
const syncServiceSid = process.env.TWILIO_SYNC_SERVICE_SID;

const client = new Twilio(apiKey, apiSecret, { accountSid });

// create a Sync service
const service = client.sync.v1.services(syncServiceSid);

console.log(
  `Creating Access Token with ACCT: ${accountSid} using key ${apiKey}`
);
// create a random string and use as token identity
let randomString = [...Array(10)]
  .map((_) => ((Math.random() * 36) | 0).toString(36))
  .join("");

// Generate access token for client
const token = new AccessToken(accountSid, apiKey, apiSecret, {
  identity: randomString,
});

// Point token to a particular Sync service.
const syncGrant = new SyncGrant({
  serviceSid: syncServiceSid,
});

token.addGrant(syncGrant);

// create Sync client
const syncClient = new SyncClient(token.toJwt());

// Generate new access token
const updateToken = () => {
  const newToken = new AccessToken(accountSid, apiKey, apiSecret, {
    identity: randomString,
  });
  newToken.addGrant(syncGrant);
  syncClient.updateToken(newToken.toJwt());
  console.log("Sync Client Token updated");
};

syncClient.on("tokenAboutToExpire", () => {
  console.log("Token about to expire, updating sync access token");
  updateToken();
});

syncClient.on("connectionStateChanged", (state) => {
  console.log(`Sync connection state changed to: ${state}`);
  if (state === "denied") updateToken();
});

module.exports = {
  client,
  syncClient,
  service,
};
