import { Card, Typography, Space, Tag } from 'antd';

const { Title, Paragraph } = Typography;

export default function Home() {
  return (
    <Card bordered>
      <Title level={3}>🎉 React + Ant Design 底座已就绪</Title>
      <Paragraph type="secondary">
        这是 amis-ai 反向飞轮的 React 底座模板。Agent 会在这个基础上按你的 Amis JSON 生成业务页面。
      </Paragraph>
      <Space size={[8, 8]} wrap>
        <Tag color="blue">React 18</Tag>
        <Tag color="cyan">TypeScript</Tag>
        <Tag color="geekblue">Vite 5</Tag>
        <Tag color="purple">Ant Design 5</Tag>
        <Tag color="green">React Router v6</Tag>
      </Space>
    </Card>
  );
}
