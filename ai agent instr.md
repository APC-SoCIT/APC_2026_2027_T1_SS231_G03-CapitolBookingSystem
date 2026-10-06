1. Start your local Express webhook server (needs the server env vars from .env.example):
node webhook.js

2. Open a separate terminal window to create a temporary public tunnel to your local server:
cloudflared tunnel --url http://localhost:8000
Copy the generated public https://*.trycloudflare.com URL from your terminal output.
(Or serve the deployed webhook directly: on Railway the site doubles as the webhook
server, so the callback URL is https://<your-domain>/inquiry-bot.)

3. Connecting the Meta Messenger Webhook
Navigate to your Meta App Dashboard and open your Messenger configuration settings.
Under Webhooks, set the Callback URL to your webhook URL ending with /inquiry-bot
(e.g., [https://your-url.trycloudflare.com/inquiry-bot](https://your-url.trycloudflare.com/inquiry-bot)).
Enter your matching VERIFY_TOKEN.
Subscribe to the messages event subscription field to enable real-time automated messaging.
