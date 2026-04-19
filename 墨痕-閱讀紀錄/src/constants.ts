import { ReadingStatus } from './types';

export const DEFAULT_STATUSES: ReadingStatus[] = ['待閱讀', '閱讀中', '已完食', '已放棄'];

export const INITIAL_GENRES = ['小說', '散文', '詩集', '心理學', '商業理財', '藝術設計', '歷史', '科普'];

export const INITIAL_TAGS = ['經典', '療癒', '深刻', '工具書', '睡前讀物'];

export const STATUS_COLORS: Record<ReadingStatus, string> = {
  '待閱讀': 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  '閱讀中': 'bg-azure/10 text-azure border-azure/20 dark:bg-slate-800/60 dark:text-slate-400 dark:border-slate-700/50',
  '已完食': 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  '已放棄': 'bg-slate-400/10 text-slate-400 border-slate-400/20',
};
