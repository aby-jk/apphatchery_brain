import { HashRouter, Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { ProjectsPage } from './pages/ProjectsPage'
import { AskPage } from './pages/AskPage'
import { ItemDetail } from './pages/ItemDetail'
import { TopicDetail } from './pages/Topics'
import { Activity } from './pages/Activity'
import { SourcesAdmin } from './pages/SourcesAdmin'
import { MemoryPage } from './pages/MemoryPage'

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<ProjectsPage />} />
        <Route path="/p/:projectId" element={<Layout />}>
          <Route index element={<AskPage />} />
          <Route path="item/:id" element={<ItemDetail />} />
          <Route path="topics/:id" element={<TopicDetail />} />
          <Route path="memory" element={<MemoryPage />} />
          <Route path="activity" element={<Activity />} />
          <Route path="admin" element={<SourcesAdmin />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}

export default App
