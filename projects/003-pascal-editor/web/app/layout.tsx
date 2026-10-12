import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: '003 · Pascal 3D 建筑编辑器',
  description: '直接使用 Pascal 原库的建筑展示与交互编辑：住宅样板、官方示例、平面图、家具与参数化构件。',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="zh-CN" className="dark"><body>{children}</body></html>;
}
