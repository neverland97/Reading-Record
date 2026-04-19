import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { X, TrendingUp, Users, Tag, Calendar, Award, ChevronLeft, ChevronRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Book } from '../types';

interface AnnualReportProps {
  books: Book[];
  onClose: () => void;
}

const AnnualReport: React.FC<AnnualReportProps> = ({ books, onClose }) => {
  const currentYear = new Date().getFullYear().toString();
  const [selectedYear, setSelectedYear] = useState<string>(currentYear);

  const availableYears = useMemo(() => {
    const years = new Set<string>();
    books.filter(b => b.status === '已完食').forEach(book => {
      const date = book.readingDate ? new Date(book.readingDate) : new Date(book.createdAt);
      if (!isNaN(date.getTime())) {
        years.add(date.getFullYear().toString());
      }
    });
    if (years.size === 0) return [currentYear];
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [books, currentYear]);

  // If selected year is not in available years and we have data, reset to latest available
  useMemo(() => {
    if (!availableYears.includes(selectedYear) && availableYears.length > 0 && availableYears[0] !== currentYear) {
      setSelectedYear(availableYears[0]);
    }
  }, [availableYears, selectedYear, currentYear]);

  const stats = useMemo(() => {
    const finishedBooks = books.filter(b => b.status === '已完食');
    const filteredByYear = finishedBooks.filter(book => {
      const date = book.readingDate ? new Date(book.readingDate) : new Date(book.createdAt);
      return !isNaN(date.getTime()) && date.getFullYear().toString() === selectedYear;
    });
    
    // Global Yearly data (for line chart)
    const yearlyMap: Record<string, number> = {};
    finishedBooks.forEach(book => {
      const date = book.readingDate ? new Date(book.readingDate) : new Date(book.createdAt);
      if (!isNaN(date.getTime())) {
        const year = date.getFullYear().toString();
        yearlyMap[year] = (yearlyMap[year] || 0) + 1;
      }
    });

    // Filtered data (for detail stats)
    const monthlyMap: Record<string, number> = {};
    const authorMap: Record<string, number> = {};
    const tagMap: Record<string, number> = {};
    
    filteredByYear.forEach(book => {
      const date = book.readingDate ? new Date(book.readingDate) : new Date(book.createdAt);
      const monthStr = (date.getMonth() + 1).toString().padStart(2, '0');
      monthlyMap[monthStr] = (monthlyMap[monthStr] || 0) + 1;
      
      if (book.author) {
        authorMap[book.author] = (authorMap[book.author] || 0) + 1;
      }
      
      book.tags.forEach(tag => {
        tagMap[tag] = (tagMap[tag] || 0) + 1;
      });
    });

    // Fill missing months for bar chart
    const monthlyData = Array.from({ length: 12 }, (_, i) => {
      const m = (i + 1).toString().padStart(2, '0');
      return { month: `${i + 1}月`, count: monthlyMap[m] || 0 };
    });

    const yearlyData = Object.entries(yearlyMap)
      .map(([year, count]) => ({ year, count }))
      .sort((a, b) => a.year.localeCompare(b.year));

    const topAuthors = Object.entries(authorMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const topTags = Object.entries(tagMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return { 
      yearlyData, 
      monthlyData, 
      topAuthors, 
      topTags, 
      totalFinishedYear: filteredByYear.length,
      totalFinishedAll: finishedBooks.length 
    };
  }, [books, selectedYear]);

  const COLORS = ['#7d9bbd', '#9ab3c1', '#7d8f69', '#87cefa', '#007fff'];

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }} 
        onClick={onClose} 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" 
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }} 
        exit={{ opacity: 0, scale: 0.9, y: 20 }} 
        className="relative w-full max-w-2xl bg-paper dark:bg-slate-900 rounded-[2.5rem] shadow-2xl flex flex-col max-h-[90vh] border border-slate-100 dark:border-slate-800"
      >
        {/* Header */}
        <div className="px-8 pt-8 pb-4 flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-[var(--text-ink)] italic font-serif">年度閱讀報告</h2>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-2">
              <p className="text-sm text-slate-400 font-medium whitespace-nowrap">數據回顧與閱讀分析</p>
              <div className="flex items-center gap-2">
                <div className="relative group">
                  <input 
                    type="number"
                    min="1900"
                    max="2100"
                    value={selectedYear}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val.length <= 4) setSelectedYear(val);
                    }}
                    className="w-20 px-2 py-1 bg-white dark:bg-slate-800/80 rounded-lg text-xs font-bold text-accent border border-slate-200 dark:border-slate-700/50 focus:border-accent outline-none transition-all placeholder:text-slate-400"
                  />
                  <Calendar size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
                {availableYears.length > 0 && selectedYear !== availableYears[0] && (
                  <button 
                    onClick={() => setSelectedYear(availableYears[0])}
                    className="text-[10px] font-bold text-accent hover:underline flex items-center gap-1"
                  >
                    切換至最新 ({availableYears[0]})
                  </button>
                )}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-400 hover:text-[var(--text-ink)] transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-8 pb-8 space-y-8 custom-scrollbar">
          {stats.totalFinishedAll === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-300">
                <Calendar size={32} />
              </div>
              <p className="text-slate-400 font-medium">目前還沒有已完食的書籍數據<br/>快去讀完一本書來生成報告吧！</p>
            </div>
          ) : stats.totalFinishedYear === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
              <p className="text-slate-400 font-medium">{selectedYear} 年還沒有完成的閱讀紀錄</p>
            </div>
          ) : (
            <>
              {/* Summary Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-accent/5 dark:bg-accent/10 p-4 rounded-3xl border border-accent/10">
                  <p className="text-[10px] font-bold text-accent uppercase mb-1 flex items-center gap-1">
                    <Award size={12} /> {selectedYear} 完食
                  </p>
                  <p className="text-3xl font-serif font-bold text-[var(--text-ink)]">{stats.totalFinishedYear} <span className="text-sm font-sans font-normal opacity-60">本</span></p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-3xl border border-slate-100 dark:border-slate-800/50">
                  <p className="text-[10px] font-bold text-accent uppercase mb-1 flex items-center gap-1">
                    <TrendingUp size={12} /> 年度目標達成
                  </p>
                  <p className="text-3xl font-serif font-bold text-accent">
                    {Math.round(stats.totalFinishedYear / 12 * 10) / 10} 
                    <span className="text-sm font-sans font-normal opacity-60"> 本/月</span>
                  </p>
                </div>
              </div>

              {/* Monthly Chart */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-2">
                  <Calendar size={12} /> {selectedYear} 月度閱讀分佈
                </label>
                <div className="h-48 w-full bg-slate-50/50 dark:bg-slate-800/20 rounded-3xl p-4 border border-slate-100/50 dark:border-slate-800/30">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.3} />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                      <YAxis hide />
                      <Tooltip 
                        cursor={{ fill: 'rgba(125, 155, 189, 0.1)' }}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '12px' }}
                      />
                      <Bar dataKey="count" fill="var(--color-accent)" radius={[4, 4, 0, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Authors & Tags */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-2">
                    <Users size={12} /> {selectedYear} 最愛作者
                  </label>
                  <div className="space-y-2">
                    {stats.topAuthors.length > 0 ? stats.topAuthors.map((author, i) => (
                      <div key={author.name} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800/50">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-slate-300 w-4">{i + 1}</span>
                          <span className="text-xs font-bold text-accent truncate max-w-[120px]">{author.name}</span>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-accent/10 text-accent rounded-full">{author.count} 本</span>
                      </div>
                    )) : (
                      <p className="text-[10px] text-slate-400 text-center py-4">無數據</p>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-2">
                    <Tag size={12} /> {selectedYear} 閱讀偏好
                  </label>
                  {stats.topTags.length > 0 ? (
                    <div className="h-44 w-full flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={stats.topTags}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={60}
                            paddingAngle={5}
                            dataKey="count"
                          >
                            {stats.topTags.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="flex flex-col gap-1 ml-4 justify-center">
                        {stats.topTags.map((tag, i) => (
                          <div key={tag.name} className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                            <span className="text-[10px] text-slate-500 font-medium truncate max-w-[80px]">{tag.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-400 text-center py-4">無數據</p>
                  )}
                </div>
              </div>

              {/* Yearly History */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-2">
                  <TrendingUp size={12} /> 歷年閱讀對比
                </label>
                <div className="h-40 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={stats.yearlyData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.2} />
                      <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                      <YAxis hide />
                      <Tooltip />
                      <Line type="monotone" dataKey="count" stroke="var(--color-accent)" strokeWidth={3} dot={{ fill: 'var(--color-accent)', r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-6 border-t border-slate-50 dark:border-slate-800 text-center">
          <p className="text-[10px] text-slate-300 dark:text-slate-600 font-medium tracking-widest uppercase">Keep tracking your {selectedYear} reading journey</p>
        </div>
      </motion.div>
    </div>
  );
};

export default AnnualReport;
