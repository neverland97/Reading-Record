import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Plus, Search, BookOpen, CheckCircle2, Clock, XCircle, Star, Bookmark, 
  Download, Upload, Trash2, Edit3, ChevronDown, Quote, Settings, 
  X, AlertCircle, Type, MoreVertical, ArrowLeft, Dices, TrendingUp, BarChart2, Share2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Book, ReadingStatus, AppData } from './types';
import { DEFAULT_STATUSES, INITIAL_GENRES, INITIAL_TAGS, STATUS_COLORS } from './constants';
import AnnualReport from './components/AnnualReport';
import ShareCard from './components/ShareCard';

const STORAGE_KEY = 'reading_log_data_v2';

// --- Components ---

const HalfStarRating = ({ value, onChange, readonly = false }: { value: number, onChange?: (v: number) => void, readonly?: boolean }) => {
  const stars = [1, 2, 3, 4, 5];
  const size = readonly ? 12 : 24;
  return (
    <div className="flex items-center gap-0.5">
      {stars.map((star) => {
        return (
          <div key={star} className="relative flex">
            {/* Left half */}
            <div 
              className={`cursor-pointer ${readonly ? 'cursor-default' : ''}`}
              onClick={() => !readonly && onChange?.(star - 0.5)}
            >
              <div className="relative overflow-hidden" style={{ width: size / 2, height: size }}>
                <Star size={size} className="text-slate-200 dark:text-slate-800" />
                <div className="absolute inset-0 overflow-hidden" style={{ width: value >= star - 0.5 ? '100%' : '0%' }}>
                  <Star size={size} className="text-amber-400 fill-amber-400" />
                </div>
              </div>
            </div>
            {/* Right half */}
            <div 
              className={`cursor-pointer ${readonly ? 'cursor-default' : ''}`}
              onClick={() => !readonly && onChange?.(star)}
            >
              <div className="relative overflow-hidden" style={{ width: size / 2, height: size }}>
                <div className="absolute right-0">
                  <Star size={size} className="text-slate-200 dark:text-slate-800" />
                  <div className="absolute inset-0 overflow-hidden" style={{ width: value >= star ? '100%' : '0%' }}>
                    <Star size={size} className="text-amber-400 fill-amber-400" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const CustomConfirm = ({ isOpen, title, message, onConfirm, onCancel }: any) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onCancel} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative w-full max-w-xs bg-paper rounded-2xl p-6 shadow-2xl text-center">
          <AlertCircle className="mx-auto text-rose-500 mb-4" size={32} />
          <h3 className="text-lg font-bold mb-2 text-ink">{title}</h3>
          <p className="text-sm text-slate-500 mb-6 font-medium">{message}</p>
          <div className="flex gap-3">
            <button onClick={onCancel} className="flex-1 py-2 bg-[var(--bg-mute)] dark:bg-slate-800/60 rounded-xl text-sm font-medium text-slate-400 border border-slate-100/50 dark:border-none">取消</button>
            <button onClick={onConfirm} className="flex-1 py-2 bg-rose-500 text-white rounded-xl text-sm font-medium">確定</button>
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

// --- Main App ---

export default function App() {
  const [data, setData] = useState<AppData>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (!parsed.settings) parsed.settings = { fontSize: 'medium', darkMode: false };
        if (parsed.settings.darkMode === undefined) parsed.settings.darkMode = false;
        return parsed;
      } catch (e) { console.error(e); }
    }
    return { 
      books: [], 
      customGenres: INITIAL_GENRES, 
      customTags: INITIAL_TAGS, 
      settings: { fontSize: 'medium', darkMode: false } 
    };
  });

  const [filter, setFilter] = useState<ReadingStatus | '全部'>('全部');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isManageOpen, setIsManageOpen] = useState<'genres' | 'tags' | null>(null);
  const [editingItem, setEditingItem] = useState<{ index: number, value: string } | null>(null);
  const [confirmData, setConfirmData] = useState<{ id: string, title: string } | null>(null);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [viewingBook, setViewingBook] = useState<Book | null>(null);
  const [showShareCard, setShowShareCard] = useState<Book | null>(null);
  const [showStatsReport, setShowStatsReport] = useState(false);
  const [returnToState, setReturnToState] = useState<{ editingBook: Book | null, formData: Partial<Book> } | null>(null);

  const [formData, setFormData] = useState<Partial<Book>>({});

  useEffect(() => { 
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    
    // Dark Mode
    if (data.settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Font Size Scaling
    const rootSize = typeof data.settings.fontSize === 'number' 
      ? `${data.settings.fontSize}px` 
      : (data.settings.fontSize === 'small' ? '14px' : data.settings.fontSize === 'large' ? '18px' : '16px');
    document.documentElement.style.fontSize = rootSize;

    // Custom Accent Colors
    const currentAccent = data.settings.darkMode 
      ? (data.settings.darkAccentColor || '#9ab3c1') 
      : (data.settings.accentColor || '#7d9bbd');
    document.documentElement.style.setProperty('--color-accent', currentAccent);
    document.body.style.setProperty('--color-accent', currentAccent);
    
    // Add soft accent color (15% opacity)
    const softAccent = currentAccent + '26';
    document.documentElement.style.setProperty('--color-accent-soft', softAccent);
    document.body.style.setProperty('--color-accent-soft', softAccent);
  }, [data]);

  const stats = useMemo(() => ({
    total: data.books.length,
    finished: data.books.filter(b => b.status === '已完食').length,
    toRead: data.books.filter(b => b.status === '待閱讀').length,
    dropped: data.books.filter(b => b.status === '已放棄').length,
  }), [data.books]);

  const booksBySameAuthor = useMemo(() => {
    if (!formData.author || formData.author.trim() === '') return [];
    return data.books.filter(b => 
      b.author.toLowerCase() === formData.author?.toLowerCase() && 
      b.id !== editingBook?.id
    );
  }, [data.books, formData.author, editingBook]);

  const filteredBooks = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return data.books.filter(b => {
      const matchesFilter = filter === '全部' || b.status === filter;
      const matchesSearch = b.title.toLowerCase().includes(q) || 
                           b.author.toLowerCase().includes(q) ||
                           b.tags.some(t => t.toLowerCase().includes(q));
      const matchesFavorite = !showFavoritesOnly || b.isFavorite;
      const matchesRating = ratingFilter === null || Math.floor(b.rating) === ratingFilter;
      
      return matchesFilter && matchesSearch && matchesFavorite && matchesRating;
    }).sort((a, b) => b.createdAt - a.createdAt);
  }, [data.books, filter, searchQuery, showFavoritesOnly, ratingFilter]);

  const handleOpenModal = (book?: Book, draft?: Partial<Book>) => {
    setViewingBook(null); // Close view modal if transitioning
    setEditingBook(book || null);
    if (!book && !draft) setReturnToState(null); // Reset return path if starting fresh
    setFormData(draft || book || {
      title: '', author: '', rating: 0, status: '待閱讀', genre: '', tags: [],
      readingDate: new Date().toISOString().split('T')[0], quote: '', review: '', isFavorite: false
    });
    setIsModalOpen(true);
  };

  const handleSaveBook = () => {
    if (!formData.title) return;
    const bookData: Book = {
      id: editingBook?.id || crypto.randomUUID(),
      title: formData.title || '',
      author: formData.author || '',
      rating: formData.rating || 0,
      status: formData.status as ReadingStatus || '待閱讀',
      genre: formData.genre || '',
      tags: formData.tags || [],
      readingDate: formData.readingDate || '',
      quote: formData.quote || '',
      review: formData.review || '',
      isFavorite: formData.isFavorite || false,
      createdAt: editingBook?.createdAt || Date.now()
    };
    const updatedBooks = editingBook ? data.books.map(b => b.id === editingBook.id ? bookData : b) : [bookData, ...data.books];
    setData({ ...data, books: updatedBooks });
    setIsModalOpen(false);
  };

  const exportData = () => {
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reading-log-backup.json`;
    a.click();
  };

  const pickRandomToRead = () => {
    const toReadBooks = data.books.filter(b => b.status === '待閱讀');
    if (toReadBooks.length === 0) return;
    const randomIndex = Math.floor(Math.random() * toReadBooks.length);
    setViewingBook(toReadBooks[randomIndex]);
  };

  const importData = (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const imported = JSON.parse(ev.target?.result as string);
        if (imported.books) setData(imported);
      } catch (err) { alert('匯入失敗'); }
    };
    reader.readAsText(file);
  };

  return (
    <div className={`min-h-screen pb-24 font-size-${data.settings.fontSize} text-[var(--text-ink)] transition-colors duration-300`}>
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[var(--bg-header)] backdrop-blur-md border-b border-slate-100 dark:border-slate-800/30 px-4 py-2 transition-colors">
        <div className="absolute inset-0 bg-gradient-to-r from-accent/2 to-transparent pointer-events-none hidden dark:block" />
        <div className="max-w-md mx-auto flex justify-between items-center relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-accent rounded-lg flex items-center justify-center text-white">
              <BookOpen size={18} />
            </div>
            <h1 className="!text-[15px] font-bold tracking-tight text-[var(--text-ink)]">墨痕</h1>
          </div>
          <button onClick={() => setIsSettingsOpen(true)} className="p-1.5 text-slate-400 hover:text-accent transition-colors">
            <Settings size={18} />
          </button>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 mt-4">
        {/* Stats - Icon Only */}
        <div className="grid grid-cols-4 gap-1.5 mb-3">
          {[
            { label: '總數', value: stats.total, icon: BookOpen, color: 'text-slate-400' },
            { label: '完食', value: stats.finished, icon: CheckCircle2, color: 'text-emerald-500' },
            { label: '待讀', value: stats.toRead, icon: Clock, color: 'text-amber-500' },
            { label: '放棄', value: stats.dropped, icon: XCircle, color: 'text-slate-400' },
          ].map((stat) => (
              <div key={stat.label} className="bg-[var(--bg-mute)] border border-slate-200 dark:border-slate-800/30 rounded-xl p-1.5 flex flex-col items-center justify-center text-center relative overflow-hidden transition-all shadow-md">
                <div className="absolute inset-0 bg-gradient-to-br from-accent/1 to-transparent pointer-events-none hidden dark:block" />
                <stat.icon className={`${stat.color} mb-0.5 relative z-10`} size={14} />
                <span className="text-xs font-bold leading-none text-[var(--text-ink)] relative z-10">{stat.value}</span>
              </div>
          ))}
        </div>

        {/* Search & Filter */}
        <div className="space-y-3 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" placeholder="搜尋書名、作者或標籤..." value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[var(--bg-mute)] border border-slate-200/60 dark:border-slate-800/50 rounded-xl focus:ring-2 focus:ring-accent/20 outline-none text-sm text-[var(--text-ink)] placeholder:text-slate-500 transition-colors"
            />
          </div>
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {['全部', ...DEFAULT_STATUSES].map((s) => (
              <button
                key={s} onClick={() => setFilter(s as any)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap border ${
                  filter === s ? 'bg-accent text-white shadow-sm border-accent' : 'bg-[var(--bg-mute)] dark:bg-slate-800/40 text-slate-400 dark:text-slate-500 border-slate-100/50 dark:border-slate-800/50'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 mt-1 pt-2">
            <button 
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${
                showFavoritesOnly 
                  ? 'bg-accent/10 text-accent border-accent/20' 
                  : 'bg-[var(--bg-mute)] text-slate-400 border-slate-100/50 dark:border-slate-800/50'
              }`}
            >
              <Bookmark size={12} fill={showFavoritesOnly ? "currentColor" : "none"} />
              僅看收藏
            </button>
            
            <div className="h-4 w-px bg-slate-100 dark:bg-slate-800 mx-1" />
            
            {filter === '待閱讀' && stats.toRead > 0 && (
              <button 
                onClick={pickRandomToRead}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 hover:bg-indigo-500/20 transition-all active:scale-95 whitespace-nowrap"
                title="隨機幫我選一本待讀書籍"
              >
                <Dices size={12} />
                隨機選一本
              </button>
            )}
            
            <div className="relative flex items-center">
              <select
                value={ratingFilter === null ? '' : ratingFilter}
                onChange={(e) => setRatingFilter(e.target.value === '' ? null : Number(e.target.value))}
                className={`appearance-none pl-2.5 pr-6 py-1.5 rounded-lg text-[10px] font-bold transition-all border outline-none ${
                  ratingFilter !== null
                    ? 'bg-amber-400/10 text-amber-500 border-amber-400/20'
                    : 'bg-[var(--bg-mute)] text-slate-400 border-slate-100/50 dark:border-slate-800/50'
                }`}
              >
                <option value="">星級篩選</option>
                {[5, 4, 3, 2, 1].map(star => (
                  <option key={star} value={star}>{star} 星級</option>
                ))}
              </select>
              <ChevronDown size={10} className="absolute right-2 pointer-events-none text-slate-400" />
            </div>
          </div>
        </div>

        {/* Book Cards - Compact Bar Design */}
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {filteredBooks.map((book) => (
              <motion.div 
                layout 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, scale: 0.95 }} 
                key={book.id} 
                className="glass-card p-3 flex gap-3 relative group cursor-pointer hover:border-accent/30 transition-all active:scale-[0.98]"
                onClick={() => setViewingBook(book)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`text-[0.5rem] px-1.5 py-0.5 rounded-md border font-medium whitespace-nowrap ${STATUS_COLORS[book.status]}`}>{book.status}</span>
                      <h3 className="text-sm font-bold truncate text-ink">{book.title}</h3>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setData({ ...data, books: data.books.map(b => b.id === book.id ? { ...b, isFavorite: !b.isFavorite } : b) });
                        }} 
                        className={`transition-colors p-1 ${book.isFavorite ? 'text-accent' : 'text-slate-200 dark:text-slate-800'}`}
                      >
                        <Bookmark size={14} fill={book.isFavorite ? "currentColor" : "none"} />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmData({ id: book.id, title: book.title });
                        }} 
                        className="p-1 text-slate-300 hover:text-rose-500"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-slate-400 text-[0.625rem] truncate max-w-[60%]">{book.author || '未知作者'}</p>
                    <HalfStarRating value={book.rating} readonly />
                  </div>
                  {book.tags && book.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1 mb-1.5 overflow-hidden">
                      {book.tags.map(t => (
                        <span key={t} className="text-[0.5rem] px-1.5 py-0.5 bg-accent/5 text-accent dark:bg-slate-800/60 dark:text-slate-400 rounded-md border border-accent/10 dark:border-slate-700/50 font-medium">#{t}</span>
                      ))}
                    </div>
                  )}
                  {book.review && (
                    <p className="text-slate-500 dark:text-slate-400 text-[0.625rem] line-clamp-1 italic border-l-2 border-slate-100 dark:border-slate-800 pl-2 mt-1">
                      {book.review}
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {filteredBooks.length === 0 && <div className="py-12 text-center text-slate-400 italic text-sm">尚未有紀錄...</div>}
        </div>
      </main>

      {/* FAB */}
      <button onClick={() => handleOpenModal()} className="fixed right-6 bottom-8 w-14 h-14 bg-gradient-to-br from-accent to-accent/80 text-white rounded-full shadow-xl flex items-center justify-center active:scale-90 transition-transform z-40">
        <Edit3 size={24} />
      </button>

      {/* Modals */}
      <AnimatePresence>
        {viewingBook && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setViewingBook(null)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 300 }} className="relative w-full max-w-sm bg-paper rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
              <div className="flex-1 overflow-y-auto px-6 pt-10 pb-6 custom-scrollbar">
                <div className="text-center mb-6">
                  <div className="inline-block px-2 py-0.5 rounded-md border text-[10px] font-bold mb-2 transition-colors duration-300 bg-accent/5 dark:bg-accent/10 text-accent border-accent/20 dark:border-accent/30">
                    {viewingBook.genre || '未分類'}
                  </div>
                  <h2 className="text-xl font-bold text-ink mb-1">{viewingBook.title}</h2>
                  <div className="flex flex-col items-center gap-1">
                    <p className="text-slate-400 text-xs">{viewingBook.author || '未知作者'}</p>
                    {viewingBook.readingDate && (
                      <p className="text-[10px] text-slate-300 dark:text-slate-500 font-medium italic">讀於 {viewingBook.readingDate}</p>
                    )}
                  </div>
                </div>

                <div className="flex justify-center gap-4 mb-8">
                  <div className="text-center">
                    <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">評分</p>
                    <HalfStarRating value={viewingBook.rating} readonly />
                  </div>
                  <div className="w-px h-8 bg-slate-100 dark:bg-slate-800" />
                  <div className="text-center">
                    <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">狀態</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${STATUS_COLORS[viewingBook.status]}`}>{viewingBook.status}</span>
                  </div>
                </div>

                <div className="space-y-6">
                  {viewingBook.tags && viewingBook.tags.length > 0 && (
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold mb-2">標籤</p>
                      <div className="flex flex-wrap gap-1.5 max-h-16 overflow-y-auto pr-1 custom-scrollbar pb-0.5">
                        {viewingBook.tags.map(t => (
                          <span key={t} className="px-2 py-0.5 bg-accent/5 text-accent dark:bg-slate-800/60 dark:text-slate-400 dark:border-slate-700/50 text-[9px] font-bold rounded-lg border border-accent/10">{t}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {viewingBook.quote && (
                    <div className="relative p-4 bg-accent/5 rounded-2xl border border-accent/10">
                      <Quote className="absolute -top-2 -left-1 text-accent opacity-20" size={20} />
                      <p className="text-xs italic text-[var(--text-ink)] leading-relaxed font-serif line-clamp-4">「{viewingBook.quote}」</p>
                    </div>
                  )}

                  {viewingBook.review && (
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold mb-2">讀後心得</p>
                      <p className="text-xs text-[var(--text-ink)] leading-relaxed whitespace-pre-wrap">{viewingBook.review}</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="p-6 border-t border-slate-50 dark:border-slate-800/50 flex flex-col gap-3">
                {returnToState && (
                  <button 
                    onClick={() => {
                      handleOpenModal(returnToState.editingBook || undefined, returnToState.formData);
                      setReturnToState(null);
                    }} 
                    className="w-full py-2.5 bg-accent/10 text-accent text-xs font-bold rounded-xl border border-accent/20 flex items-center justify-center gap-2 animate-in fade-in slide-in-from-bottom-2"
                  >
                    <ArrowLeft size={14} /> 返回原本編輯：{returnToState.formData.title || '無標題'}
                  </button>
                )}
                <div className="flex gap-3">
                  <button onClick={() => setShowShareCard(viewingBook)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-400 hover:text-accent transition-all active:scale-95" title="分享書卡">
                    <Share2 size={20} />
                  </button>
                  <button onClick={() => { setViewingBook(null); setReturnToState(null); }} className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-400 text-xs font-bold rounded-full hover:bg-slate-50 transition-colors">關閉</button>
                  <button onClick={() => handleOpenModal(viewingBook)} className="flex-1 btn-primary text-xs py-2 shadow-accent/20">編輯內容</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 300 }} className="relative w-full max-w-md bg-paper rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="px-6 py-4 border-b border-slate-50 dark:border-slate-800/50 flex justify-between items-center">
                <h2 className="font-bold text-lg text-ink">{editingBook ? '編輯紀錄' : '新增紀錄'}</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400"><X size={20} /></button>
              </div>
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5 custom-scrollbar pb-10">
                <div className="space-y-4">
                  <input type="text" placeholder="書名 *" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="input-field" />
                  <div className="space-y-2">
                    <input type="text" placeholder="作者" value={formData.author} onChange={e => setFormData({ ...formData, author: e.target.value })} className="input-field" />
                    {booksBySameAuthor.length > 0 && (
                      <div className="px-3 py-2 bg-[var(--bg-mute)] dark:bg-slate-900/40 rounded-xl border border-slate-100/50 dark:border-slate-800/50 animate-in fade-in slide-in-from-top-1 duration-200 shadow-sm transition-colors">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1.5 flex items-center gap-1">
                          <BookOpen size={10} /> 同作者的其他紀錄 ({booksBySameAuthor.length})
                        </p>
                        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto custom-scrollbar pr-1">
                          {booksBySameAuthor.map(b => (
                            <button 
                              key={b.id} 
                              onClick={() => {
                                setReturnToState({ editingBook, formData });
                                setIsModalOpen(false);
                                setViewingBook(b);
                              }} 
                              className="flex items-center gap-1.5 px-2 py-1 bg-paper dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-800 shadow-sm hover:border-accent/40 active:scale-95 transition-all"
                            >
                              <span className="text-[10px] text-slate-600 dark:text-slate-300 font-medium">{b.title}</span>
                              <span className={`text-[8px] px-1 rounded-sm border ${STATUS_COLORS[b.status]}`}>{b.status}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex justify-between items-center bg-slate-800 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-700/50 shadow-sm transition-colors">
                  <span className="text-xs font-bold text-white">評分</span>
                  <HalfStarRating value={formData.rating || 0} onChange={v => setFormData({ ...formData, rating: v })} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">閱讀狀態</label>
                  <div className="flex flex-wrap gap-2">
                    {DEFAULT_STATUSES.map(s => (
                      <button key={s} onClick={() => setFormData({ ...formData, status: s })} className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${formData.status === s ? 'bg-accent text-white border-accent' : 'bg-paper text-slate-500 border-slate-100 dark:border-slate-800'}`}>{s}</button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3 transition-colors">
                  <div className="flex-1 min-w-0 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/50 space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase block">閱讀日期</label>
                    <input 
                      type="date" 
                      value={formData.readingDate} 
                      onChange={e => setFormData({ ...formData, readingDate: e.target.value })} 
                      className="w-full bg-transparent border-none outline-none focus:ring-0 p-0 text-[var(--text-ink)] text-xs cursor-pointer block"
                    />
                  </div>
                  <div className="flex-1 min-w-0 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/50 space-y-1">
                    <div className="flex justify-between items-center pr-0.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">書籍類型</label>
                      <button onClick={() => setIsManageOpen('genres')} className="text-[10px] text-accent font-bold">管理</button>
                    </div>
                    <select value={formData.genre} onChange={e => setFormData({ ...formData, genre: e.target.value })} className="w-full bg-transparent border-none outline-none focus:ring-0 p-0 text-[var(--text-ink)] text-xs appearance-none cursor-pointer block">
                      <option value="">選擇類型...</option>
                      {data.customGenres.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">標籤</label>
                    <button onClick={() => setIsManageOpen('tags')} className="text-[10px] text-accent font-bold">管理</button>
                  </div>
                  <div className="max-h-16 overflow-y-auto pr-1 custom-scrollbar">
                    <div className="flex flex-wrap gap-1.5 pb-1">
                      {data.customTags.map(tag => (
                        <button key={tag} onClick={() => {
                          const tags = formData.tags || [];
                          setFormData({ ...formData, tags: tags.includes(tag) ? tags.filter(t => t !== tag) : [...tags, tag] });
                        }} className={`px-2.5 py-1 rounded-lg text-[10px] font-medium border transition-all ${formData.tags?.includes(tag) ? 'bg-accent/10 text-accent border-accent/20' : 'bg-paper text-slate-400 border-slate-100 dark:border-slate-800'}`}>{tag}</button>
                      ))}
                    </div>
                  </div>
                </div>
                <textarea rows={2} placeholder="名言佳句..." value={formData.quote} onChange={e => setFormData({ ...formData, quote: e.target.value })} className="input-field resize-none italic text-sm" />
                <textarea rows={4} placeholder="心得筆記..." value={formData.review} onChange={e => setFormData({ ...formData, review: e.target.value })} className="input-field resize-none text-sm" />
              </div>
              <div className="p-6 border-t border-slate-50 dark:border-slate-900/30 flex gap-3">
                <button onClick={handleSaveBook} className="flex-1 btn-primary py-3">儲存紀錄</button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Settings Modal */}
        {isSettingsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsSettingsOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative w-full max-w-sm bg-paper rounded-[2rem] p-6 shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-bold text-lg text-ink">設定</h2>
                <button onClick={() => setIsSettingsOpen(false)} className="p-1 text-slate-400"><X size={20} /></button>
              </div>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">黑夜模式</label>
                  <button 
                    onClick={() => setData({ ...data, settings: { ...data.settings, darkMode: !data.settings.darkMode } })}
                    className={`w-12 h-6 rounded-full transition-colors relative ${data.settings.darkMode ? 'bg-accent' : 'bg-slate-100 border border-slate-200/50'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${data.settings.darkMode ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">風格配色 (Hex)</label>
                    <button 
                      onClick={() => setData({ ...data, settings: { ...data.settings, accentColor: undefined, darkAccentColor: undefined } })}
                      className="text-[10px] text-accent"
                    >重置</button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-400">淺色模式</span>
                        <div className="w-2 h-2 rounded-full border border-slate-200" style={{ backgroundColor: data.settings.accentColor || '#7d9bbd' }} />
                      </div>
                      <input 
                        type="text" 
                        placeholder="#7d9bbd"
                        value={data.settings.accentColor || ''} 
                        onChange={e => setData({ ...data, settings: { ...data.settings, accentColor: e.target.value } })}
                        className="w-full px-3 py-1.5 bg-[var(--bg-mute)] dark:bg-slate-900/40 rounded-lg text-xs outline-none focus:ring-1 focus:ring-accent text-ink placeholder:text-slate-400 border border-slate-100 dark:border-slate-800/50"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-400">深色模式</span>
                        <div className="w-2 h-2 rounded-full border border-slate-700" style={{ backgroundColor: data.settings.darkAccentColor || '#9ab3c1' }} />
                      </div>
                      <input 
                        type="text" 
                        placeholder="#9ab3c1"
                        value={data.settings.darkAccentColor || ''} 
                        onChange={e => setData({ ...data, settings: { ...data.settings, darkAccentColor: e.target.value } })}
                        className="w-full px-3 py-1.5 bg-[var(--bg-mute)] dark:bg-slate-900/40 rounded-lg text-xs outline-none focus:ring-1 focus:ring-accent text-ink placeholder:text-slate-400 border border-slate-100 dark:border-slate-800/50"
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2"><Type size={14} /> 字體大小 (px)</label>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setData({ ...data, settings: { ...data.settings, fontSize: 14 } })} className="text-[10px] text-accent">小</button>
                      <button onClick={() => setData({ ...data, settings: { ...data.settings, fontSize: 16 } })} className="text-[10px] text-accent">中</button>
                      <button onClick={() => setData({ ...data, settings: { ...data.settings, fontSize: 18 } })} className="text-[10px] text-accent">大</button>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-[var(--bg-mute)] dark:bg-slate-900/40 p-2 rounded-xl border border-slate-100 dark:border-slate-800/50 shadow-sm transition-colors">
                    <input 
                      type="number" 
                      min="10" 
                      max="30"
                      value={typeof data.settings.fontSize === 'number' ? data.settings.fontSize : (data.settings.fontSize === 'small' ? 14 : data.settings.fontSize === 'large' ? 18 : 16)} 
                      onChange={e => setData({ ...data, settings: { ...data.settings, fontSize: Number(e.target.value) } })}
                      className="flex-1 bg-transparent border-none outline-none text-sm text-ink font-bold text-center"
                    />
                    <span className="text-xs text-slate-400 pr-2 font-bold">PIXELS</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2"><BarChart2 size={14} /> 閱讀分析</label>
                  <button onClick={() => { setIsSettingsOpen(false); setShowStatsReport(true); }} className="w-full flex items-center justify-between p-3 bg-accent text-white rounded-xl text-sm font-bold shadow-sm hover:opacity-90 transition-all">
                    <div className="flex items-center gap-3">
                      <TrendingUp size={18} />
                      <span>查看年度閱讀報告</span>
                    </div>
                  </button>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2"><Download size={14} /> 數據管理</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={exportData} className="flex items-center justify-center gap-2 py-2 bg-white dark:bg-slate-800 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-700 hover:bg-slate-50">
                      <Download size={14} /> 匯出
                    </button>
                    <label className="flex items-center justify-center gap-2 py-2 bg-white dark:bg-slate-800 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-700 cursor-pointer hover:bg-slate-50">
                      <Upload size={14} /> 匯入
                      <input type="file" accept=".json" onChange={importData} className="hidden" />
                    </label>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Share Card Modal */}
        {showShareCard && (
          <ShareCard 
            book={showShareCard} 
            onClose={() => setShowShareCard(null)} 
          />
        )}

        {/* Annual Report Modal */}
        {showStatsReport && (
          <AnnualReport 
            books={data.books} 
            onClose={() => setShowStatsReport(false)} 
          />
        )}

        {/* Manage Genres/Tags Modal */}
        {isManageOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setIsManageOpen(null); setEditingItem(null); }} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative w-full max-w-sm bg-paper rounded-[2rem] p-6 shadow-2xl flex flex-col max-h-[70vh]">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold text-lg text-ink">管理{isManageOpen === 'genres' ? '類型' : '標籤'}</h2>
                <button onClick={() => { setIsManageOpen(null); setEditingItem(null); }} className="p-1 text-slate-400"><X size={20} /></button>
              </div>
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {(isManageOpen === 'genres' ? data.customGenres : data.customTags).map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-[var(--bg-mute)] dark:bg-slate-800/40 rounded-xl group border border-slate-100/50 dark:border-slate-800/50 shadow-sm transition-colors">
                    {editingItem?.index === idx ? (
                      <input 
                        autoFocus
                        className="flex-1 bg-transparent border-none outline-none text-sm text-ink"
                        value={editingItem.value}
                        onChange={e => setEditingItem({ ...editingItem, value: e.target.value })}
                        onBlur={() => {
                          if (editingItem.value.trim()) {
                            const key = isManageOpen === 'genres' ? 'customGenres' : 'customTags';
                            const newList = [...data[key]];
                            newList[idx] = editingItem.value.trim();
                            setData({ ...data, [key]: newList });
                          }
                          setEditingItem(null);
                        }}
                        onKeyDown={e => {
                          if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                        }}
                      />
                    ) : (
                      <span className="text-sm flex-1" onClick={() => setEditingItem({ index: idx, value: item })}>{item}</span>
                    )}
                    <div className="flex gap-1">
                      <button onClick={() => setEditingItem({ index: idx, value: item })} className="p-1 text-slate-300 hover:text-accent"><Edit3 size={14} /></button>
                      <button onClick={() => {
                        const key = isManageOpen === 'genres' ? 'customGenres' : 'customTags';
                        setData({ ...data, [key]: data[key].filter((_, i) => i !== idx) });
                      }} className="p-1 text-slate-300 hover:text-rose-500"><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-slate-50 dark:border-slate-800/30 flex gap-2">
                <input type="text" id="newItemInput" placeholder={`新增${isManageOpen === 'genres' ? '類型' : '標籤'}...`} className="flex-1 px-3 py-2 bg-[var(--bg-mute)] dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/50 rounded-xl text-sm outline-none focus:border-accent text-ink placeholder:text-slate-400" onKeyDown={e => {
                  if (e.key === 'Enter') {
                    const val = (e.target as HTMLInputElement).value.trim();
                    if (val) {
                      const key = isManageOpen === 'genres' ? 'customGenres' : 'customTags';
                      if (!data[key].includes(val)) setData({ ...data, [key]: [...data[key], val] });
                      (e.target as HTMLInputElement).value = '';
                    }
                  }
                }} />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <CustomConfirm 
        isOpen={!!confirmData} title="確認刪除" message={`確定要刪除《${confirmData?.title}》的紀錄嗎？`}
        onConfirm={() => { setData({ ...data, books: data.books.filter(b => b.id !== confirmData?.id) }); setConfirmData(null); }}
        onCancel={() => setConfirmData(null)}
      />

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #374151; }
      `}</style>
    </div>
  );
}
