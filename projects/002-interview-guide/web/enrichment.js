import { foundationDetails } from './enrichment-foundations.js';
import { practiceDetails } from './enrichment-practice.js';

// 独立撰写的中文展开讲解与复习答法；原始 MDX 仍保存在固定版本快照。
export const topicDetails = { ...foundationDetails, ...practiceDetails };
