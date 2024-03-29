# Real-time Media Streamer

This is a Media Stream WSS server to Google/Microsoft/DeepGram speech server. The purpose is to enable Twilio Media Streams (multichannel inbound / outbound) to stream audio to the appropriate backend. Text that is captured is then streamed to Twilio Sync for further processing (e.g. Flex Plugin)

## Getting Started
Ensure that you have the appropriate keys from Google/Microsoft/Deepgram for the respective backends. Configure these in the .env file


### Configuration
Configure your API keys are required
```env
#
# GOOGLE
#
GOOGLE_APPLICATION_CREDENTIALS=

#
# MICROSOFT
#
MS_SPEECH_KEY=
MS_SPEECH_REGION=

#
# DEEPGRAM
#
DEEPGRAM_API_KEY=

#
# TWILIO
#
TWILIO_ACCOUNT_SID=
TWILIO_API_KEY=
TWILIO_API_SECRET=
TWILIO_SYNC_SERVICE_SID=
```

## Example
![Demo](/docs/example.png)

### Google Cloud Run

1. Install the Google [Cloud CLI](https://cloud.google.com/sdk/docs/install)
```sh
$ gcloud init
```
2. gcloud run deploy twilio-media-receiver --source .
3. Set the environment variables (from .env)


#### Alternative
1. gcloud builds submit --pack image=[IMAGE]
2. gcloud run deploy twilio-media-receiver --image [IMAGE]