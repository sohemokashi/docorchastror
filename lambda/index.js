const express = require("express");
const serverless = require("serverless-http");
const { BedrockRuntimeClient, InvokeModelCommand } = require("@aws-sdk/client-bedrock-runtime");

const app = express();
const bedrock = new BedrockRuntimeClient({ region: process.env.AWS_REGION || "us-east-1" });

// Middleware
app.use(express.json({ limit: '10mb' }));

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Strip API Gateway stage prefix
app.use((req, res, next) => {
  if (req.url.startsWith('/v1/')) {
    req.url = req.url.substring(3);
  } else if (req.url === '/v1') {
    req.url = '/';
  }
  next();
});

/**
 * Generate task structure using AWS Bedrock
 */
async function generateTaskWithBedrock(prompt) {
  const systemPrompt = `You are a helpful task planning assistant. Convert user requests into structured task JSON.
Always respond with valid JSON in this exact format:
{
  "task": "Brief task title",
  "steps": ["Step 1", "Step 2", "Step 3"],
  "priority": "low|medium|high",
  "estimatedTime": "X minutes/hours",
  "category": "development|devops|configuration|learning|other"
}

Be specific and actionable in the steps. Do not include any explanatory text outside the JSON.`;

  const userPrompt = `Convert this request into a structured task: "${prompt}"`;

  const payload = {
    anthropic_version: "bedrock-2023-05-31",
    max_tokens: 1000,
    temperature: 0.7,
    messages: [
      {
        role: "user",
        content: `${systemPrompt}\n\n${userPrompt}`
      }
    ]
  };

  const command = new InvokeModelCommand({
    modelId: process.env.BEDROCK_MODEL_ID || "anthropic.claude-3-sonnet-20240229-v1:0",
    contentType: "application/json",
    accept: "application/json",
    body: JSON.stringify(payload)
  });

  try {
    const response = await bedrock.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    
    // Extract the text content from Claude's response
    const textContent = responseBody.content[0].text;
    
    // Parse the JSON from the response
    // Claude might wrap JSON in markdown code blocks, so we need to extract it
    let jsonMatch = textContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    throw new Error("Could not parse JSON from Bedrock response");
  } catch (error) {
    console.error("Bedrock error:", error);
    throw error;
  }
}

/**
 * Health check endpoint
 */
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "healthy", 
    timestamp: new Date().toISOString(),
    service: "task-generator"
  });
});

/**
 * Generate task endpoint
 */
app.post("/api/generate-task", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return res.status(400).json({ 
        error: "Invalid request", 
        message: "Please provide a valid prompt" 
      });
    }

    console.log("Generating task for prompt:", prompt);

    const taskData = await generateTaskWithBedrock(prompt);

    res.json({
      ...taskData,
      timestamp: new Date().toISOString(),
      originalPrompt: prompt
    });

  } catch (error) {
    console.error("Error generating task:", error);
    res.status(500).json({ 
      error: "Generation failed", 
      message: error.message || "An error occurred while generating the task"
    });
  }
});

/**
 * Fallback route
 */
app.use((req, res) => {
  res.status(404).json({ 
    error: "Not found", 
    message: "The requested endpoint does not exist",
    availableEndpoints: [
      "GET /api/health",
      "POST /api/generate-task"
    ]
  });
});

// Export handler for Lambda
module.exports.handler = serverless(app);

// For local testing
if (require.main === module) {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
