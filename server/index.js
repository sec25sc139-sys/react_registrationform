import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import mongoose from 'mongoose'
import path from 'path'
import { fileURLToPath } from 'url'

const serverDirectory = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(serverDirectory, '.env') })

const app = express()
const port = process.env.PORT || 5000

app.use(cors())
app.use(express.json())

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    completed: { type: Boolean, default: false },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    time: { type: String, trim: true, maxlength: 40 },
  },
  { timestamps: true },
)

const Task = mongoose.model('Task', taskSchema)

app.get('/api/health', (_request, response) => {
  response.json({ ok: true })
})

app.get('/api/tasks', async (_request, response) => {
  try {
    const tasks = await Task.find().sort({ completed: 1, createdAt: -1 })
    response.json(tasks)
  } catch (error) {
    response.status(500).json({ message: error.message })
  }
})

app.post('/api/tasks', async (request, response) => {
  try {
    const { title, priority, time } = request.body
    if (typeof title !== 'string' || !title.trim()) {
      return response.status(400).json({ message: 'Title is required' })
    }

    const task = await Task.create({ title, priority, time })
    response.status(201).json(task)
  } catch (error) {
    response.status(400).json({ message: error.message })
  }
})

app.patch('/api/tasks/:id', async (request, response) => {
  try {
    const updates = {}
    for (const field of ['title', 'completed', 'priority', 'time']) {
      if (field in request.body) updates[field] = request.body[field]
    }

    const task = await Task.findByIdAndUpdate(request.params.id, updates, {
      new: true,
      runValidators: true,
    })
    if (!task) return response.status(404).json({ message: 'Task not found' })
    response.json(task)
  } catch (error) {
    response.status(400).json({ message: error.message })
  }
})

app.delete('/api/tasks/:id', async (request, response) => {
  try {
    const task = await Task.findByIdAndDelete(request.params.id)
    if (!task) return response.status(404).json({ message: 'Task not found' })
    response.status(204).send()
  } catch (error) {
    response.status(400).json({ message: error.message })
  }
})

const mongodbUri = process.env.MONGODB_URI

if (!mongodbUri) {
  console.error('MONGODB_URI is missing from server/.env')
  process.exit(1)
}

mongoose
  .connect(mongodbUri)
  .then(() => {
    app.listen(port, () => console.log(`Daymark API running on http://localhost:${port}`))
  })
  .catch((error) => {
    console.error('MongoDB connection failed:', error.message)
    process.exit(1)
  })
