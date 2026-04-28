import { createBrowserRouter, Navigate } from 'react-router-dom';
import Layout from '../components/Layout';
import Login from '../views/Login';
import Chat from '../views/Chat';
import Conversation from '../views/Conversation';
import History from '../views/History';
import Templates from '../views/Templates';
import Settings from '../views/Settings';
import LlmProviders from '../views/Settings/LlmProviders';
import ModelConfigs from '../views/Settings/ModelConfigs';
import SystemSettingsTab from '../views/Settings/SystemSettings';
import Projects from '../views/Projects';
import ProjectDetail from '../views/Projects/detail';
import LegacyProjectDetail from '../views/Projects/Detail';
import KnowledgeBase from '../views/KnowledgeBase';
import SkillsHome from '../views/KnowledgeBase/SkillsHome';
import SkillBucketDetail from '../views/KnowledgeBase/SkillBucketDetail';
import SkillAuthoringWizard from '../views/KnowledgeBase/SkillAuthoringWizard';
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
      { index: true, element: <Navigate to="/projects" replace /> },
      // 通用 AI 对话页（之前 /chat 是 Amis 生成，2026-04-25 让位给纯文本对话）
      { path: 'chat', element: <Conversation /> },
      // 「Amis 生成」（自然语言 → Amis JSON），原 /chat 的本职
      { path: 'amis', element: <Chat /> },
      { path: 'history', element: <History /> },
      { path: 'templates', element: <Templates /> },
      { path: 'projects', element: <Projects /> },
      { path: 'projects/:id', element: <ProjectDetail /> },
      { path: 'projects/:id/legacy', element: <LegacyProjectDetail /> },
      // 系统设置：从单页 Tabs 升级为容器 + 三个子路由（参照知识库二级菜单）
      {
        path: 'settings',
        element: <Settings />,
        children: [
          { index: true, element: <Navigate to="providers" replace /> },
          { path: 'providers', element: <LlmProviders /> },
          { path: 'configs', element: <ModelConfigs /> },
          { path: 'system', element: <SystemSettingsTab /> },
        ],
      },
      {
        path: 'knowledge-base',
        element: <KnowledgeBase />,
        children: [
          { index: true, element: <Navigate to="skills" replace /> },
          { path: 'skills', element: <SkillsHome /> },
          { path: 'skills/new-ai', element: <SkillAuthoringWizard /> },
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
