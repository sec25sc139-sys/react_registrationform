import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'

type Priority = 'low' | 'medium' | 'high'
type View = 'today' | 'upcoming' | 'completed' | 'all'

type Task = {
  _id: string
  title: string
  completed: boolean
  priority: Priority
  time?: string
}

const starterTasks: Task[] = [
  { _id: 'task-1', title: 'Review project brief', completed: false, priority: 'high', time: '8:00 PM' },
  { _id: 'task-2', title: 'Buy groceries for dinner', completed: false, priority: 'medium', time: '5:00 PM' },
  { _id: 'task-3', title: 'Reply to important emails', completed: false, priority: 'low', time: '6:30 PM' },
  { _id: 'task-4', title: 'Go for an evening walk', completed: false, priority: 'low', time: '10:00 PM' },
  { _id: 'task-5', title: 'Read for thirty minutes', completed: false, priority: 'medium', time: '9:00 PM' },
  { _id: 'task-6', title: 'Plan tomorrow morning', completed: false, priority: 'high', time: '7:30 PM' },
]

function App() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [tasks, setTasks] = useState<Task[]>(starterTasks)
  const [view, setView] = useState<View>('today')
  const [newTask, setNewTask] = useState('')
  const [apiOnline, setApiOnline] = useState(false)

  useEffect(() => {
    fetch('http://localhost:5000/api/tasks')
      .then((response) => {
        if (!response.ok) throw new Error('API unavailable')
        return response.json()
      })
      .then((data: Task[]) => {
        setTasks(data)
        setApiOnline(true)
      })
      .catch(() => setApiOnline(false))
  }, [])

  const completedCount = tasks.filter((task) => task.completed).length
  const visibleTasks = useMemo(() => {
    if (view === 'completed') return tasks.filter((task) => task.completed)
    if (view === 'upcoming') return tasks.filter((task) => !task.completed).slice(0, 3)
    return view === 'today' ? tasks.filter((task) => !task.completed) : tasks
  }, [tasks, view])

  function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (email.trim() && password.trim()) setLoggedIn(true)
  }

  function addTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const title = newTask.trim()
    if (!title) return
    const task: Task = { _id: crypto.randomUUID(), title, completed: false, priority: 'medium', time: 'Today' }
    setTasks((current) => [...current, task])
    setNewTask('')
    fetch('http://localhost:5000/api/tasks', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(task),
    }).catch(() => undefined)
  }

  function toggleTask(task: Task) {
    setTasks((current) => current.map((item) => item._id === task._id ? { ...item, completed: !item.completed } : item))
    fetch(`http://localhost:5000/api/tasks/${task._id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ completed: !task.completed }),
    }).catch(() => undefined)
  }

  if (!loggedIn) {
    return (
      <main className="login-page">
        <section className="login-card">
          <div className="logo"><span>✦</span>Taskly</div>
          <p className="tagline">your daily to do list maker</p>
          <form className="login-form" onSubmit={login}>
            <h1>LOG IN/SIGN UP</h1>
            <label htmlFor="email">EMAIL ID</label>
            <input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
            <label htmlFor="password">PASSWORD</label>
            <input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
            <button type="submit">LOGIN</button>
          </form>
        </section>
      </main>
    )
  }

  return (
    <main className="dashboard-page">
      <aside className="sidebar">
        <div className="sidebar-title">Todo.</div>
        <nav aria-label="Task views">
          {(['today', 'upcoming', 'completed', 'all'] as View[]).map((item) => (
            <button key={item} className={view === item ? 'active' : ''} onClick={() => setView(item)} type="button">
              {item[0].toUpperCase() + item.slice(1)}
            </button>
          ))}
        </nav>
        <div className="user-note"><strong>User</strong><span>Keep it simple.</span><button type="button" onClick={() => setLoggedIn(false)}>Log out</button></div>
      </aside>

      <section className="dashboard-content">
        <header className="dashboard-header">
          <div><h1>Good evening, User!</h1><p>Here’s what you have planned for today.</p></div>
          <div className={`connection ${apiOnline ? 'online' : ''}`}><span /> {apiOnline ? 'Synced' : 'Local mode'}</div>
        </header>
        <div className="stats">
          <div><span>TODAY</span><strong>{tasks.length} tasks</strong></div>
          <div><span>COMPLETED</span><strong>{completedCount} done</strong></div>
          <div><span>PROGRESS</span><strong>{tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0}%</strong></div>
        </div>
        <section className="tasks-panel">
          <div className="panel-heading"><h2>My tasks</h2><button type="button" onClick={() => document.getElementById('new-task')?.focus()}>+ Add task</button></div>
          <form className="add-task" onSubmit={addTask}><input id="new-task" value={newTask} onChange={(event) => setNewTask(event.target.value)} placeholder="What needs to be done?" aria-label="New task" /><button type="submit" aria-label="Add task">+</button></form>
          <div className="task-list">
            {visibleTasks.map((task) => <article className="task-row" key={task._id}><button className={`checkbox ${task.completed ? 'checked' : ''}`} type="button" onClick={() => toggleTask(task)} aria-label={`Complete ${task.title}`}>{task.completed ? '✓' : ''}</button><div><strong>{task.title}</strong><span>{task.completed ? 'Done' : 'Today'} · {task.time || 'Any time'}</span></div></article>)}
            {!visibleTasks.length && <p className="empty">No tasks in this view.</p>}
          </div>
        </section>
      </section>
    </main>
  )
}

export default App
