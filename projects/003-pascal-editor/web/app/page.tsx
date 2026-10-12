'use client';

import dynamic from 'next/dynamic';

const Showroom = dynamic(() => import('./showroom'), {
  ssr: false,
  loading: () => <main className="boot-screen"><span className="boot-mark">P</span><h1>Pascal 3D 建筑编辑器</h1><p>正在准备建筑编辑器…</p></main>,
});

export default function Page() {
  return <Showroom />;
}
