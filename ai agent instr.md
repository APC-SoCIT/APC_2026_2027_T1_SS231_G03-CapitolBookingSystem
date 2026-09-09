1. Start your local Express webhook server:
node webhook.js

2. Open a separate terminal window to create a temporary public tunnel to your local server:
cloudflared tunnel --url http://localhost:8000
Copy the generated public https://*.trycloudflare.com URL from your terminal output.

3. Connecting the Meta Messenger Webhook
Navigate to your Meta App Dashboard and open your Messenger configuration settings.
Under Webhooks, set the Callback URL to your active Cloudflare tunnel URL ending with /delivery (e.g., [https://your-url.trycloudflare.com/delivery](https://your-url.trycloudflare.com/delivery)).
Enter your matching VERIFY_TOKEN.
Subscribe to the messages event subscription field to enable real-time automated messaging.
