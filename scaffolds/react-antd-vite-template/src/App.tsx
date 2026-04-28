import { Layout } from 'antd';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';

const { Header, Content, Footer } = Layout;

export default function App() {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ color: '#fff', fontWeight: 600 }}>
        amis-ai 生成 · React + Ant Design
      </Header>
      <Content style={{ padding: 24 }}>
        <Routes>
          <Route path="/" element={<Home />} />
        </Routes>
      </Content>
      <Footer style={{ textAlign: 'center', color: '#999' }}>
        由 amis-ai 反向飞轮生成 · React + Vite + antd v5
      </Footer>
    </Layout>
  );
}
