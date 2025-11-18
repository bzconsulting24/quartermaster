import { Router } from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';
import crypto from 'crypto';

const router = Router();
const execAsync = promisify(exec);

// Set this in your environment variables
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || '';

/**
 * Verify GitHub webhook signature
 */
function verifyGitHubSignature(payload: string, signature: string): boolean {
  if (!WEBHOOK_SECRET) {
    console.warn('WEBHOOK_SECRET not set - skipping signature verification');
    return true;
  }

  const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
  const digest = 'sha256=' + hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}

/**
 * Trigger Docker rebuild from GitHub
 * This runs on the HOST machine, not inside Docker
 */
async function triggerRebuild() {
  try {
    console.log('Starting Docker rebuild from GitHub...');

    // Execute on HOST machine via docker exec to quartermaster-backend
    // This allows us to run git pull and docker-compose on the host
    const rebuildScript = `
      cd /app && \
      echo "Pulling latest changes from GitHub..." && \
      git fetch origin main && \
      git reset --hard origin/main && \
      echo "Rebuilding frontend and backend containers..." && \
      docker-compose -f docker-compose.dev.yml up -d --build --no-deps --force-recreate backend frontend && \
      echo "Rebuild completed successfully"
    `;

    await execAsync(`sh -c '${rebuildScript}'`);
    console.log('Docker rebuild completed successfully');

    return { success: true, message: 'Rebuild triggered successfully from GitHub' };
  } catch (error) {
    console.error('Rebuild failed:', error);
    return {
      success: false,
      message: 'Rebuild failed',
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * GitHub webhook endpoint
 * POST /api/webhook/github
 */
router.post('/github', async (req, res) => {
  try {
    const signature = req.headers['x-hub-signature-256'] as string;
    const event = req.headers['x-github-event'] as string;
    const payload = JSON.stringify(req.body);

    // Verify signature if secret is set
    if (WEBHOOK_SECRET && !verifyGitHubSignature(payload, signature)) {
      console.error('Invalid webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Only process push events
    if (event !== 'push') {
      console.log(`Ignoring event type: ${event}`);
      return res.json({ message: 'Event ignored', event });
    }

    const { ref, repository } = req.body;

    // Only rebuild on main branch
    if (ref !== 'refs/heads/main') {
      console.log(`Ignoring push to branch: ${ref}`);
      return res.json({ message: 'Branch ignored', ref });
    }

    console.log(`Received push to main from ${repository?.full_name}`);

    // Trigger rebuild asynchronously (don't wait for it to complete)
    // This allows the webhook to respond quickly
    triggerRebuild().then((result) => {
      if (result.success) {
        console.log('Rebuild completed successfully');
      } else {
        console.error('Rebuild failed:', result.error);
      }
    });

    // Respond immediately to GitHub
    res.json({
      message: 'Rebuild triggered',
      branch: ref,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Health check endpoint for webhook
 */
router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    webhookConfigured: !!WEBHOOK_SECRET,
    timestamp: new Date().toISOString()
  });
});

export default router;
