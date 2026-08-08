import { Navigate, Route, Routes } from 'react-router-dom'
import { ETS_2026 } from './data/registry'
import ExamRunner from './pages/ExamRunner'
import ExamSetup from './pages/ExamSetup'
import History from './pages/History'
import Home from './pages/Home'
import ResultPage from './pages/ResultPage'
import TestList from './pages/TestList'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path={`/${ETS_2026.id}`} element={<TestList />} />
      <Route path={`/${ETS_2026.id}/:testId`} element={<ExamSetup />} />
      <Route path={`/${ETS_2026.id}/:testId/exam`} element={<ExamRunner />} />
      <Route path="/result/:resultId" element={<ResultPage />} />
      <Route path="/history" element={<History />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
