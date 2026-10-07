import { lazy, Suspense } from 'react'
import { Toaster } from "./components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from './lib/query-client'
// import { HashRouter as Router, Route, Routes } from 'react-router-dom';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import ScrollToTop from './components/layout/ScrollToTop';
import PageNotFound from './lib/PageNotFound';
import Home from './pages/Home';
import Group from './pages/Group';
import AllCourses from './pages/AllCourses';
import Publications from './pages/Publications';

// Loaded on demand so other pages don't download the chart library.
const Top = lazy(() => import('./pages/Top'));

function App() {
  return (
    <QueryClientProvider client={queryClientInstance}>
      <Router>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/group" element={<Group />} />
          <Route path="/publications" element={<Publications />} />
          <Route path="/teaching" element={<AllCourses />} />
          <Route
            path="/top"
            element={
              <Suspense fallback={<div className="bg-paper min-h-screen" />}>
                <Top />
              </Suspense>
            }
          />
          <Route path="*" element={<PageNotFound />} />
        </Routes>
      </Router>
      <Toaster />
    </QueryClientProvider>
  )
}

export default App