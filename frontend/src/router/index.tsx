import { createBrowserRouter, Navigate } from 'react-router-dom';
import Layout from '../components/Layout';
import Login from '../views/Login';
import Chat from '../views/Chat';
import History from '../views/History';
import Templates from '../views/Templates';
import Settings from '../views/Settings';
import Projects from '../views/Projects';
import ProjectDetail from '../views/Projects/detail';
import LegacyProjectDetail from '../views/Projects/Detail';
import KnowledgeBase from '../views/KnowledgeBase';
import SkillsHome from '../views/KnowledgeBase/SkillsHome';
import SkillBucketDetail from '../views/KnowledgeBase/SkillBucketDetail';
import CodeSamplesHome from '../views/KnowledgeBase/CodeSamplesHome';
import CodeSampleDetail from '../views/KnowledgeBase/CodeSampleDetail';

const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Navigate to="/chat" replace /> },
      { path: 'chat', element: <Chat /> },
      { path: 'history', element: <History /> },
      { path: 'templates', element: <Templates /> },
      { path: 'projects', element: <Projects /> },
      { path: 'projects/:id', element: <ProjectDetail /> },
      { path: 'projects/:id/legacy', element: <LegacyProjectDetail /> },
      { path: 'settings', element: <Settings /> },
      {
        path: 'knowledge-base',
        element: <KnowledgeBase />,
        children: [
          { index: true, element: <Navigate to="skills" replace /> },
          { path: 'skills', element: <SkillsHome /> },
          { path: 'skills/:bucket', element: <SkillBucketDetail /> },
          { path: 'code-samples', element: <CodeSamplesHome /> },
          { path: 'code-samples/:id', element: <CodeSampleDetail /> },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);

export default router;
