import type { Metadata } from 'next';
import Overview from './overview';
import './overview.css';

export const metadata: Metadata = {
  title: '003 · Pascal 项目理解｜房间设计平台的编辑器底座',
  description: '完整引导图与真实演示整理 Pascal 九类能力、八个模块、参数化几何原理、六类场景、四条复用路线、八个扩展方向和运行边界。',
};

export default function OverviewPage() {
  return <Overview />;
}
