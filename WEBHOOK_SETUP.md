# GitHub Webhook Setup for Automatic Docker Rebuilds

This guide explains how to set up automatic Docker container rebuilds when you push commits to the main branch.

## How It Works

1. You push code to GitHub (main branch) - Your local system pulls the changes
2. GitHub sends a webhook notification to your backend server
3. Your Express backend receives the webhook
4. The backend triggers Docker rebuilds of frontend and backend containers
5. Volume mounts ensure the new code is immediately available

## Prerequisites

- Docker Desktop running on Windows
- Public IP address or tunneling service (ngrok, cloudflared) to receive webhooks
- GitHub repository access

## Step 1: Generate Webhook Secret

Generate a secure secret for webhook verification:

```bash
# On Windows PowerShell
$secret = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
echo $secret

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Step 2: Configure Environment Variables

1. Copy `.env.example` to `.env` if you haven't already:
   ```bash
   copy .env.example .env
   ```

2. Add the webhook secret to your `.env` file:
   ```
   WEBHOOK_SECRET=your_generated_secret_here
   ```

## Step 3: Expose Your Webhook Endpoint

Since you're running locally, you need to expose your webhook endpoint to the internet. Choose one option:

### Option A: Using ngrok (Recommended for testing)

1. Download ngrok from https://ngrok.com/download
2. Run ngrok to expose port 4000:
   ```bash
   ngrok http 4000
   ```
3. Note the HTTPS URL provided (e.g., `https://abc123.ngrok.io`)
4. Your webhook URL will be: `https://abc123.ngrok.io/api/webhook/github`

### Option B: Using Cloudflare Tunnel (Free, more permanent)

1. Install cloudflared: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/
2. Run tunnel:
   ```bash
   cloudflared tunnel --url http://localhost:4000
   ```
3. Note the provided URL
4. Your webhook URL will be: `https://your-url.trycloudflare.com/api/webhook/github`

## Step 4: Configure GitHub Webhook

1. Go to your GitHub repository: https://github.com/bzconsulting24/quartermaster
2. Navigate to **Settings** → **Webhooks** → **Add webhook**
3. Configure the webhook:
   - **Payload URL**: Your ngrok/cloudflared URL + `/api/webhook/github`
     - Example: `https://abc123.ngrok.io/api/webhook/github`
   - **Content type**: `application/json`
   - **Secret**: Paste the `WEBHOOK_SECRET` you generated
   - **SSL verification**: Enable SSL verification (recommended)
   - **Which events**: Select "Just the push event"
   - **Active**: ✅ Check this box
4. Click **Add webhook**

## Step 5: Start Your Application

1. Rebuild your Docker containers to include the new dependencies:
   ```bash
   docker-compose -f docker-compose.dev.yml down
   docker-compose -f docker-compose.dev.yml up --build
   ```

2. Verify the webhook endpoint is working:
   ```bash
   curl http://localhost:4000/api/webhook/health
   ```

   Should return:
   ```json
   {
     "status": "ok",
     "webhookConfigured": true,
     "timestamp": "2025-11-17T..."
   }
   ```

## Step 6: Test the Webhook

1. Make a small change to your code
2. Commit and push to the main branch:
   ```bash
   git add .
   git commit -m "test: webhook trigger"
   git push origin main
   ```

3. Check the webhook delivery in GitHub:
   - Go to **Settings** → **Webhooks**
   - Click on your webhook
   - Click on the **Recent Deliveries** tab
   - You should see a successful delivery (green checkmark)

4. Check your Docker container logs:
   ```bash
   docker logs quartermaster-app
   ```

   You should see messages like:
   ```
   Received push to main from bzconsulting24/quartermaster
   Starting Docker rebuild...
   Git pull completed
   Docker rebuild completed
   ```

## Troubleshooting

### Webhook returns 401 Unauthorized
- The `WEBHOOK_SECRET` in your `.env` doesn't match GitHub's configured secret
- Regenerate the secret and update both locations

### Webhook returns 500 Error
- Check Docker logs: `docker logs quartermaster-app`
- Ensure Docker socket is properly mounted in docker-compose.dev.yml
- Verify git and docker-compose are installed in the container

### Container can't execute git commands
- Ensure the Dockerfile.dev includes git installation
- Check that the working directory `/app` has git initialized

### Container can't execute docker-compose commands
- Verify Docker socket is mounted: `//var/run/docker.sock:/var/run/docker.sock`
- On Windows, ensure Docker Desktop is running
- Check container has docker-cli and docker-cli-compose installed

### Rebuild doesn't trigger
- Verify you're pushing to the `main` branch (not `master` or other branches)
- Check GitHub webhook delivery status for errors
- Ensure ngrok/cloudflared tunnel is still running

## Security Considerations

⚠️ **Important Security Notes:**

1. **Docker Socket Access**: Mounting the Docker socket gives the container full control over Docker. This is a security risk in production environments.

2. **Webhook Secret**: Always use a strong, randomly generated secret and keep it private.

3. **Production Deployment**: For production, consider:
   - Running the webhook receiver as a separate service (not in the app container)
   - Using a CI/CD platform (GitHub Actions, GitLab CI) instead
   - Implementing additional security measures (IP whitelisting, rate limiting)

## Alternative Approaches

For production environments, consider these alternatives:

1. **GitHub Actions**: Use GitHub Actions to build and deploy automatically
2. **Separate Webhook Service**: Run a dedicated webhook receiver outside Docker
3. **CI/CD Platform**: Use Jenkins, CircleCI, or similar platforms

## Webhook Endpoint Reference

- **POST** `/api/webhook/github` - Receives GitHub webhook notifications
- **GET** `/api/webhook/health` - Health check endpoint

### Webhook Response

Successful webhook:
```json
{
  "message": "Rebuild triggered",
  "branch": "refs/heads/main",
  "timestamp": "2025-11-17T12:00:00.000Z"
}
```

Ignored (not main branch):
```json
{
  "message": "Branch ignored",
  "ref": "refs/heads/feature-branch"
}
```
