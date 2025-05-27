// Example of secure Google Cloud Functions implementation

const functions = require('@google-cloud/functions-framework');
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
const { PubSub } = require('@google-cloud/pubsub');

// Initialize Secret Manager
const secretManager = new SecretManagerServiceClient();

// Initialize PubSub
const pubsub = new PubSub();

// Helper to access secrets securely
async function getSecret(name) {
  try {
    const projectId = process.env.GOOGLE_CLOUD_PROJECT;
    const [version] = await secretManager.accessSecretVersion({
      name: `projects/${projectId}/secrets/${name}/versions/latest`,
    });
    return version.payload.data.toString('utf8');
  } catch (error) {
    console.error(`Error accessing secret ${name}:`, error);
    throw new Error('Could not access required secrets');
  }
}

// Example of secure HTTP function
functions.http('secureHttpFunction', async (req, res) => {
  // Set security headers
  res.set('Content-Security-Policy', "default-src 'self'");
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('X-Frame-Options', 'DENY');
  res.set('X-XSS-Protection', '1; mode=block');
  res.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  
  try {
    // Validate authentication
    const authHeader = req.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const token = authHeader.split('Bearer ')[1];
    
    // Verify token (simplified example)
    const isValid = await verifyToken(token);
    if (!isValid) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    // Input validation
    const { data } = req.body;
    if (!data || typeof data !== 'string') {
      return res.status(400).json({ error: 'Invalid input' });
    }
    
    // Process data securely
    const result = await processData(data);
    
    // Return success response
    return res.status(200).json({ success: true, result });
  } catch (error) {
    console.error('Function error:', error);
    
    // Don't expose internal error details
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Example of secure event-triggered function
functions.cloudEvent('securePubSubFunction', async (cloudEvent) => {
  try {
    // Decode and validate message
    const base64Data = cloudEvent.data.message.data;
    const jsonData = Buffer.from(base64Data, 'base64').toString();
    let data;
    
    try {
      data = JSON.parse(jsonData);
    } catch (error) {
      console.error('Invalid JSON in message:', error);
      return; // Exit early, message will be ack'd
    }
    
    // Validate input
    if (!data.userId || !data.action) {
      console.error('Missing required fields in message');
      return;
    }
    
    // Access secrets securely when needed
    const apiKey = await getSecret('external-api-key');
    
    // Process message securely
    await processSecureMessage(data, apiKey);
    
    console.log('Message processed successfully');
  } catch (error) {
    console.error('Error processing message:', error);
    
    // Publish error to monitoring topic
    try {
      await pubsub.topic('error-monitoring').publish(Buffer.from(
        JSON.stringify({
          source: 'securePubSubFunction',
          timestamp: new Date().toISOString(),
          error: error.message,
        })
      ));
    } catch (pubsubError) {
      console.error('Error publishing to monitoring topic:', pubsubError);
    }
  }
});

// Mock implementation of token verification
async function verifyToken(token) {
  // In a real app, use Firebase Auth, Google Auth, or other secure verification
  return token === 'valid-token';
}

// Mock implementation of data processing
async function processData(data) {
  // Process data securely
  return `Processed: ${data}`;
}

// Mock implementation of secure message processing
async function processSecureMessage(data, apiKey) {
  // Use apiKey to interact with external service securely
  console.log(`Processing ${data.action} for user ${data.userId} using API key`);
  // Actual implementation would call external services
}
