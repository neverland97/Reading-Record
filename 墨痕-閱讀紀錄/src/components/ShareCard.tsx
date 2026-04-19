import React, { useRef } from 'react';
import html2canvas from 'html2canvas-pro';
import { Share2, Download, X, Bookmark, Quote, Star } from 'lucide-react';
import { Book } from '../types';
import { STATUS_COLORS } from '../constants';

interface ShareCardProps {
  book: Book;
  onClose: () => void;
}

const ShareCard: React.FC<ShareCardProps> = ({ book, onClose }) => {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    if (!cardRef.current) return;
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
      });
      const link = document.createElement('a');
      link.download = `ReadingLog-${book.title}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Failed to generate image', err);
    }
  };

  const handleShare = async () => {
    if (!cardRef.current) return;
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
      });
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], 'share.png', { type: 'image/png' });
        if (navigator.share && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: `分享我的閱讀：${book.title}`,
            text: `這是我在 Reading Log 紀錄的書籍《${book.title}》`,
          });
        } else {
          handleDownload();
        }
      });
    } catch (err) {
      console.error('Sharing failed', err);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
      <div className="absolute inset-0" onClick={onClose} />
      
      <div className="relative w-full max-w-sm flex flex-col items-center">
        {/* Export Canvas Area */}
        <div 
          ref={cardRef}
          className="w-full bg-white rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden"
          style={{ width: '100%', maxWidth: '360px' }}
        >
          {/* Decorative background */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full -mr-16 -mt-16" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-accent/5 rounded-full -ml-12 -mb-12" />
          
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="px-3 py-1 bg-accent/10 rounded-full text-[10px] font-bold text-accent mb-4 border border-accent/20">
              {book.genre || 'Reading Log'}
            </div>
            
            <h2 className="text-2xl font-bold text-slate-900 mb-2 font-serif">{book.title}</h2>
            <p className="text-slate-500 text-sm mb-6 flex items-center gap-1">
              <span>{book.author || '未知作者'}</span>
            </p>
            
            <div className="w-full h-px bg-slate-100 mb-6" />
            
            <div className="grid grid-cols-2 gap-4 w-full mb-8">
              <div className="bg-slate-50 rounded-2xl p-4 flex flex-col items-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase mb-1">評分</span>
                <div className="flex gap-0.5 text-amber-400">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={14} fill={i < Math.round(book.rating) ? 'currentColor' : 'none'} className={i < Math.round(book.rating) ? 'text-amber-400' : 'text-slate-200'} />
                  ))}
                </div>
              </div>
              <div className="bg-slate-50 rounded-2xl p-4 flex flex-col items-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase mb-1">狀態</span>
                <span className="text-xs font-bold text-slate-600">{book.status}</span>
              </div>
            </div>

            {book.quote && (
              <div className="w-full p-6 bg-accent/5 rounded-3xl mb-6 relative">
                <Quote className="absolute top-4 left-4 text-accent/20" size={24} />
                <p className="text-sm italic text-slate-700 leading-relaxed font-serif text-center relative z-10">
                  「{book.quote}」
                </p>
              </div>
            )}

            <div className="flex flex-wrap justify-center gap-1.5 mb-8">
              {book.tags.map(t => (
                <span key={t} className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[9px] font-bold rounded-md">#{t}</span>
              ))}
            </div>
            
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-accent rounded flex items-center justify-center text-white text-[10px] font-bold">R</div>
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Reading Log</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex gap-4 w-full px-4">
          <button 
            onClick={onClose}
            className="w-12 h-12 flex items-center justify-center bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-all"
          >
            <X size={24} />
          </button>
          
          <button 
            onClick={handleDownload}
            className="flex-1 h-12 bg-white rounded-full text-slate-900 font-bold flex items-center justify-center gap-2 hover:bg-slate-50 transition-all shadow-xl"
          >
            <Download size={20} />
            儲存圖片
          </button>
          
          <button 
            onClick={handleShare}
            className="w-12 h-12 flex items-center justify-center bg-accent rounded-full text-white shadow-lg shadow-accent/20 active:scale-95 transition-all"
          >
            <Share2 size={24} />
          </button>
        </div>
        
        <p className="mt-4 text-white/40 text-[10px] font-medium uppercase tracking-widest">點擊儲存以轉存至相簿</p>
      </div>
    </div>
  );
};

export default ShareCard;
