import type { RouteObject } from 'react-router-dom'
import { App } from './App'
import { HomePage } from './pages/HomePage'
import { LearnPage } from './pages/LearnPage'
import { LessonPage } from './pages/LessonPage'
import { StrategyPage } from './pages/StrategyPage'
import { MentalMathPage } from './pages/MentalMathPage'
import { RulesPage } from './pages/RulesPage'
import { GlossaryPage } from './pages/GlossaryPage'
import { PracticePage } from './pages/PracticePage'
import { PracticeSessionPage } from './pages/PracticeSessionPage'
import { SimulatePage } from './pages/SimulatePage'
import { ExamPage } from './pages/ExamPage'
import { ReportPage } from './pages/ReportPage'
import { AnalyzePage } from './pages/AnalyzePage'
import { SettingsPage } from './pages/SettingsPage'
import { ReferencePage } from './pages/ReferencePage'
import { PlanPage } from './pages/PlanPage'
import { ErrorPage } from './components/ErrorPage'

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <App />,
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'learn', element: <LearnPage /> },
      { path: 'learn/strategy', element: <StrategyPage /> },
      { path: 'learn/mental-math', element: <MentalMathPage /> },
      { path: 'learn/rules', element: <RulesPage /> },
      { path: 'learn/glossary', element: <GlossaryPage /> },
      { path: 'learn/:type', element: <LessonPage /> },
      { path: 'practice', element: <PracticePage /> },
      { path: 'practice/session', element: <PracticeSessionPage /> },
      { path: 'simulate', element: <SimulatePage /> },
      { path: 'simulate/exam', element: <ExamPage /> },
      { path: 'report/:id', element: <ReportPage /> },
      { path: 'analyze', element: <AnalyzePage /> },
      { path: 'plan', element: <PlanPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: 'reference', element: <ReferencePage /> },
    ],
  },
]
