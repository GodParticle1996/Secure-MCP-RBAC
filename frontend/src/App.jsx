import { useEffect, useState } from 'react';
import { useAuth } from './context/AuthContext';
import LoginForm from './components/LoginForm';
import { apiRequest } from './api/client';

export default function App() {
  const { auth, logout } = useAuth();
  const [projects, setProjects] = useState([]);
  const [message, setMessage] = useState('');

  async function loadProjects() {
    try {
      setProjects(await apiRequest('/api/projects'));
    } catch (err) {
      setMessage(err.message);
    }
  }

  useEffect(() => {
    if (auth) {
      loadProjects();
    }
  }, [auth]);

  async function createProject() {
    await apiRequest('/api/projects', {
      method: 'POST',
      body: JSON.stringify({ name: `Project ${Date.now()}`, description: 'Generated from UI' })
    });
    loadProjects();
  }

  async function deleteProject(id) {
    try {
      await apiRequest(`/api/projects/${id}`, { method: 'DELETE' });
      loadProjects();
    } catch (err) {
      setMessage(err.message);
    }
  }

  if (!auth) return <LoginForm />;

  return (
    <main className="container">
      <h1>Secure Project Manager</h1>
      <p>Logged in role: {auth.role}</p>
      <button onClick={createProject}>Create Project</button>
      <button onClick={logout}>Logout</button>
      {message && <p className="error">{message}</p>}
      <ul>
        {projects.map((project) => (
          <li key={project.id} className="card">
            <strong>{project.name}</strong>
            <p>{project.description}</p>
            {auth.role === 'human_admin' ? (
              <button onClick={() => deleteProject(project.id)}>Delete</button>
            ) : (
              <small>Delete disabled for ai_agent role</small>
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}
