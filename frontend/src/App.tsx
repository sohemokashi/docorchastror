import { useState } from 'react'
import './App.css'

const API_ENDPOINT = import.meta.env.VITE_API_ENDPOINT || 'http://localhost:3001/api'

interface TaskResponse {
  task: string
  steps: string[]
  priority: string
  estimatedTime: string
  category?: string
}

const EXAMPLE_PROMPTS = [
  "I want to install python",
  "Set up a new React project",
  "Deploy application to AWS",
  "Create a REST API with Node.js",
  "Configure Docker for development"
]

function App() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState<TaskResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateTask = async () => {
    if (!input.trim()) {
      setError('Please enter a task description')
      return
    }

    setLoading(true)
    setError(null)
    setOutput(null)

    try {
      const response = await fetch(`${API_ENDPOINT}/generate-task`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: input }),
      })

      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`)
      }

      const data = await response.json()
      setOutput(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate task')
    } finally {
      setLoading(false)
    }
  }

  const handleClear = () => {
    setInput('')
    setOutput(null)
    setError(null)
  }

  const handleExampleClick = (example: string) => {
    setInput(example)
    setOutput(null)
    setError(null)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      generateTask()
    }
  }

  return (
    <div className="app">
      <div className="header">
        <h1>Task Generator</h1>
        <p>Convert plain text into structured tasks using AI</p>
      </div>

      <div className="container">
        <div className="panel input-section">
          <h2>Input</h2>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Describe what you want to do... (e.g., 'I want to install python')"
          />
          <div className="button-group">
            <button 
              className="generate-btn" 
              onClick={generateTask}
              disabled={loading || !input.trim()}
            >
              {loading ? 'Generating...' : 'Generate Task (Ctrl+Enter)'}
            </button>
            <button className="clear-btn" onClick={handleClear}>
              Clear
            </button>
          </div>
        </div>

        <div className="panel output-section">
          <h2>Output</h2>
          {loading && (
            <div className="loading">
              <div className="spinner"></div>
              <span>Processing with AWS Bedrock...</span>
            </div>
          )}
          {error && (
            <div className="error">
              <strong>Error:</strong> {error}
            </div>
          )}
          {output && (
            <pre>{JSON.stringify(output, null, 2)}</pre>
          )}
          {!loading && !error && !output && (
            <pre style={{ color: '#888' }}>
              Task JSON will appear here...
            </pre>
          )}
        </div>
      </div>

      <div className="example-section">
        <h3>Quick Examples</h3>
        <div className="examples">
          {EXAMPLE_PROMPTS.map((example, index) => (
            <div
              key={index}
              className="example-chip"
              onClick={() => handleExampleClick(example)}
            >
              {example}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default App
