import { HashRouter, Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { ProjectsPage } from './pages/ProjectsPage'
import { AskPage } from './pages/AskPage'
import { ItemDetail } from './pages/ItemDetail'
import { TopicDetail } from './pages/Topics'
import { SourcesAdmin } from './pages/SourcesAdmin'
import { MemoryPage } from './pages/MemoryPage'
import { DashboardPage } from './pages/DashboardPage'

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<ProjectsPage />} />
        <Route path="/p/:projectId" element={<Layout />}>
          <Route index element={<AskPage />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="item/:id" element={<ItemDetail />} />
          <Route path="topics/:id" element={<TopicDetail />} />
          <Route path="memory" element={<MemoryPage />} />
          <Route path="admin" element={<SourcesAdmin />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}

export default App
