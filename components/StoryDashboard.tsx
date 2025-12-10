import React, { useState, useEffect, useRef } from 'react';
import { StoryData, Chapter } from '../types';
import { generateChapterContentStream } from '../services/geminiService';
import { ChevronRight, ChevronLeft, Save, ArrowLeft, RefreshCw, Image as ImageIcon, Settings, Type, AlignLeft, Sun, Moon, Coffee, Book, Home } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface StoryDashboardProps {
  storyData: StoryData;
  onUpdateChapter: (chapterIndex: number, content: string, isGenerated: boolean) => void;
  onSave: () => void;
  onBack: () => void;
}

type Theme = 'light' | 'sepia' | 'dark';
type FontSize = 'sm' | 'base' | 'lg' | 'xl';

const StoryDashboard: React.FC<StoryDashboardProps> = ({ storyData, onUpdateChapter, onSave, onBack }) => {
  // -1 implies "Intro/Cover" page, 0+ implies specific chapter
  const [activeChapterIndex, setActiveChapterIndex] = useState(-1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamedContent, setStreamedContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  // Reader Settings
  const [showSettings, setShowSettings] = useState(false);
  const [theme, setTheme] = useState<Theme>('sepia');
  const [fontSize, setFontSize] = useState<FontSize>('lg');
  
  const activeChapter = activeChapterIndex >= 0 ? storyData.chapters[activeChapterIndex] : null;
  const contentEndRef = useRef<HTMLDivElement>(null);
  const generationTriggeredRef = useRef<number | null>(null);

  // Auto-scroll during generation
  useEffect(() => {
    if (isGenerating && contentEndRef.current) {
      contentEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [streamedContent, isGenerating]);

  // Auto-Write Feature: Trigger generation when opening an empty chapter
  useEffect(() => {
    if (activeChapterIndex >= 0 && activeChapter) {
      if (!activeChapter.isGenerated && !isGenerating && generationTriggeredRef.current !== activeChapterIndex) {
        generationTriggeredRef.current = activeChapterIndex;
        handleGenerateChapter();
      }
    }
  }, [activeChapterIndex, activeChapter]);

  const handleGenerateChapter = async () => {
    if (isGenerating || !activeChapter) return;
    
    setIsGenerating(true);
    setStreamedContent(''); 
    
    // Clear old content if any (re-generating)
    onUpdateChapter(activeChapterIndex, '', false);

    try {
      const prevChapter = activeChapterIndex > 0 ? storyData.chapters[activeChapterIndex - 1] : null;
      
      const stream = await generateChapterContentStream(
        storyData, // Cast to StoryConfig if needed, but StoryData extends it partially
        activeChapter,
        prevChapter,
        storyData.chapters
      );

      let fullContent = '';
      for await (const chunk of stream) {
        fullContent += chunk;
        setStreamedContent(prev => prev + chunk);
      }

      onUpdateChapter(activeChapterIndex, fullContent, true);
    } catch (error) {
      console.error("Failed to generate chapter:", error);
      alert("Có lỗi xảy ra khi viết chương. Vui lòng thử lại.");
      generationTriggeredRef.current = null;
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate slight delay for feedback
    await new Promise(r => setTimeout(r, 500));
    onSave();
    setIsSaving(false);
    alert("Đã lưu truyện thành công vào thiết bị!");
  };

  const getThemeClasses = () => {
    switch (theme) {
      case 'dark': return 'bg-gray-900 text-gray-300';
      case 'sepia': return 'bg-[#f4ecd8] text-[#5b4636]';
      case 'light': default: return 'bg-white text-gray-900';
    }
  };

  const getFontSizeClass = () => {
    switch (fontSize) {
      case 'sm': return 'prose-sm';
      case 'base': return 'prose-base';
      case 'lg': return 'prose-lg';
      case 'xl': return 'prose-xl';
    }
  };

  const renderCoverPage = () => (
    <div className="max-w-6xl mx-auto p-4 md:p-8 animate-fade-in relative z-10">
      
      {/* Blurred Backdrop Effect */}
      <div className="absolute inset-0 -z-10 overflow-hidden rounded-3xl mx-4 md:mx-8 mt-4 md:mt-8">
          {storyData.coverImage && (
              <div 
                  className="absolute inset-0 bg-cover bg-center blur-3xl opacity-20 scale-125"
                  style={{ backgroundImage: `url(data:image/png;base64,${storyData.coverImage})` }}
              />
          )}
      </div>

      <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 md:p-12 shadow-2xl border border-white/50">
        <div className="flex flex-col md:flex-row gap-12 items-start">
          
          {/* Cover Image Section - Enhanced */}
          <div className="w-full md:w-5/12 flex flex-col gap-6 items-center">
            <div className="relative w-full max-w-[320px] aspect-[2/3] rounded-r-xl rounded-l-sm shadow-2xl overflow-hidden group perspective-1000 ring-1 ring-gray-900/5 bg-gray-200">
              {/* The Image */}
              {storyData.coverImage ? (
                <img 
                  src={`data:image/png;base64,${storyData.coverImage}`} 
                  alt="Book Cover" 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gray-100">
                  <ImageIcon size={48} className="mb-2" />
                  <span className="text-sm">Chưa có ảnh bìa</span>
                </div>
              )}
              
              {/* Book Spine Effect */}
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-r from-white/30 to-transparent z-20"></div>
              <div className="absolute left-1 top-0 bottom-0 w-px bg-black/10 z-20"></div>
            </div>

            {/* Genre Tags below image */}
            <div className="flex flex-wrap gap-2 justify-center w-full max-w-[320px]">
                <span className="px-3 py-1 bg-gray-900 text-white text-xs font-bold uppercase tracking-wider rounded-md shadow-sm border border-gray-900">
                    {storyData.genre}
                </span>
                {storyData.subGenres?.map((tag) => (
                    <span key={tag} className="px-3 py-1 bg-white text-gray-700 border border-gray-200 text-xs font-medium rounded-md shadow-sm">
                        {tag}
                    </span>
                ))}
            </div>

          </div>

          {/* Info Section */}
          <div className="w-full md:w-7/12 space-y-8">
            <div>
                <h1 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 leading-tight mb-4">
                  {storyData.title}
                </h1>
                <div className="h-1.5 w-24 bg-indigo-600 rounded-full"></div>
            </div>
            
            <div className="prose prose-lg prose-slate max-w-none text-gray-700 leading-relaxed">
              <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wide flex items-center gap-2 mb-3">
                <Book size={20} className="text-indigo-600" /> Văn Án
              </h3>
              <div className="bg-indigo-50/50 p-6 rounded-xl border border-indigo-100 font-serif text-gray-800 leading-loose text-justify shadow-inner">
                <ReactMarkdown>{storyData.longDescription}</ReactMarkdown>
              </div>
            </div>

            <div className="pt-6">
               <button 
                onClick={() => setActiveChapterIndex(0)}
                className="group w-full md:w-auto inline-flex items-center justify-center gap-3 bg-gray-900 hover:bg-gray-800 text-white px-10 py-4 rounded-xl font-bold shadow-xl transition-all transform hover:-translate-y-1 hover:shadow-2xl"
              >
                <span className="text-lg">Bắt Đầu Đọc</span> 
                <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`flex flex-col h-screen overflow-hidden transition-colors duration-300 ${activeChapterIndex === -1 ? 'bg-gray-50' : getThemeClasses()}`}>
      {/* Header */}
      <header className={`border-b px-6 py-4 flex items-center justify-between shadow-sm z-20 transition-colors duration-300 ${
        activeChapterIndex === -1 ? 'bg-white border-gray-200' : 
        theme === 'dark' ? 'bg-gray-800 border-gray-700' : 
        theme === 'sepia' ? 'bg-[#eaddcf] border-[#d3c4b1]' : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center gap-4">
          <button onClick={onBack} className={`p-2 rounded-full transition flex items-center gap-2 text-sm font-medium ${theme === 'dark' ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}>
            <Home size={20} /> <span className="hidden sm:inline">Trang Chủ</span>
          </button>
          <div className="hidden md:block">
            <h1 className={`text-lg font-bold truncate max-w-md ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>{storyData.title}</h1>
            {activeChapterIndex >= 0 && (
               <p className={`text-xs uppercase tracking-wider ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                 Chương {activeChapterIndex + 1} / {storyData.totalChapters || storyData.chapters.length}
               </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
           <button 
             onClick={handleSave}
             disabled={isSaving}
             className={`px-4 py-2 text-sm font-bold rounded-full flex items-center gap-2 transition ${
               isSaving ? 'opacity-50 cursor-not-allowed' : ''
             } ${
               theme === 'dark' 
                 ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                 : 'bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-50'
             }`}
           >
             {isSaving ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />} 
             {isSaving ? 'Đang lưu...' : 'Lưu Truyện'}
           </button>

           {activeChapterIndex >= 0 && (
             <div className="relative">
                <button 
                  onClick={() => setShowSettings(!showSettings)}
                  className={`p-2 rounded-full transition ${theme === 'dark' ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-black/5 text-gray-600'}`}
                >
                  <Type size={20} />
                </button>
                
                {showSettings && (
                  <div className="absolute right-0 top-12 w-64 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 z-50 animate-in fade-in slide-in-from-top-2 text-gray-800">
                    <div className="mb-4">
                      <label className="text-xs font-semibold text-gray-500 uppercase mb-2 block">Màu nền</label>
                      <div className="flex gap-2">
                        <button onClick={() => setTheme('light')} className={`flex-1 h-8 rounded border ${theme === 'light' ? 'ring-2 ring-indigo-500 border-transparent' : 'border-gray-300'} bg-white`}></button>
                        <button onClick={() => setTheme('sepia')} className={`flex-1 h-8 rounded border ${theme === 'sepia' ? 'ring-2 ring-indigo-500 border-transparent' : 'border-[#d3c4b1]'} bg-[#f4ecd8]`}></button>
                        <button onClick={() => setTheme('dark')} className={`flex-1 h-8 rounded border ${theme === 'dark' ? 'ring-2 ring-indigo-500 border-transparent' : 'border-gray-700'} bg-gray-900`}></button>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase mb-2 block">Cỡ chữ</label>
                      <div className="flex gap-2 items-end bg-gray-100 rounded-lg p-1">
                        <button onClick={() => setFontSize('sm')} className={`flex-1 py-1 text-xs rounded ${fontSize === 'sm' ? 'bg-white shadow-sm' : ''}`}>A</button>
                        <button onClick={() => setFontSize('base')} className={`flex-1 py-1 text-sm rounded ${fontSize === 'base' ? 'bg-white shadow-sm' : ''}`}>A</button>
                        <button onClick={() => setFontSize('lg')} className={`flex-1 py-1 text-lg rounded ${fontSize === 'lg' ? 'bg-white shadow-sm' : ''}`}>A</button>
                        <button onClick={() => setFontSize('xl')} className={`flex-1 py-1 text-xl rounded ${fontSize === 'xl' ? 'bg-white shadow-sm' : ''}`}>A</button>
                      </div>
                    </div>
                  </div>
                )}
             </div>
           )}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar: Outline (Hidden on mobile) */}
        <aside className={`w-72 border-r flex flex-col overflow-hidden hidden md:flex transition-colors duration-300 ${
           theme === 'dark' ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div 
            onClick={() => setActiveChapterIndex(-1)}
            className={`p-4 border-b cursor-pointer transition-colors ${
              activeChapterIndex === -1 
                ? 'bg-indigo-600 text-white' 
                : theme === 'dark' ? 'border-gray-700 hover:bg-gray-800' : 'border-gray-100 hover:bg-gray-50'
            }`}
          >
            <h2 className="font-semibold text-sm flex items-center gap-2">
              <ImageIcon size={16} /> Bìa & Thông Tin
            </h2>
          </div>
          <div className={`p-2 text-xs font-semibold uppercase tracking-wider ${theme === 'dark' ? 'bg-gray-800 text-gray-400' : 'bg-gray-50 text-gray-500'}`}>
            Mục Lục
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {storyData.chapters.map((chapter, idx) => (
              <div
                key={idx} // Sử dụng index làm key để tránh lỗi nếu AI trả về chapterNumber trùng nhau hoặc không liên tục
                onClick={() => !isGenerating && setActiveChapterIndex(idx)}
                className={`p-3 rounded-md cursor-pointer border transition-all ${
                  idx === activeChapterIndex
                    ? 'bg-indigo-50 border-indigo-200 shadow-sm'
                    : theme === 'dark' ? 'border-transparent hover:bg-gray-800 text-gray-300' : 'border-transparent hover:bg-gray-50 text-gray-700'
                } ${idx === activeChapterIndex && theme === 'dark' ? '!bg-indigo-900/50 !border-indigo-700 !text-white' : ''} 
                ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    chapter.isGenerated 
                      ? 'bg-green-100 text-green-700' 
                      : theme === 'dark' ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600'
                  }`}>
                    #{idx + 1}
                  </span>
                  {idx === activeChapterIndex && <ChevronRight size={14} className="text-indigo-500" />}
                </div>
                <h3 className="font-medium text-sm truncate">
                  {chapter.title}
                </h3>
              </div>
            ))}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col h-full relative overflow-y-auto scroll-smooth">
          {activeChapterIndex === -1 ? (
            <div className="bg-white min-h-full">
               {renderCoverPage()}
            </div>
          ) : (
            <>
              {/* Chapter Content */}
              <div className="p-4 md:p-8 lg:p-12 min-h-full">
                <div className="max-w-3xl mx-auto pb-20">
                    
                    {/* Chapter Title & Meta */}
                    <div className="text-center mb-12">
                       <h2 className={`text-3xl font-serif font-bold mb-4 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
                         {/* Xử lý hiển thị tiêu đề để tránh lặp lại "Chương 5: Chương 5" */}
                         {activeChapter!.title.toLowerCase().startsWith('chương') 
                           ? activeChapter!.title.replace(/^chương\s+\d+\s*[:.-]?\s*/i, `Chương ${activeChapterIndex + 1}: `)
                           : `Chương ${activeChapterIndex + 1}: ${activeChapter!.title}`
                         }
                       </h2>
                       {!activeChapter!.isGenerated && !isGenerating && (
                         <div className="inline-flex items-center gap-2 text-indigo-500 animate-pulse bg-indigo-50 px-3 py-1 rounded-full text-sm">
                           <RefreshCw size={14} className="animate-spin" /> Đang chuẩn bị viết...
                         </div>
                       )}
                    </div>

                    {/* Content Area */}
                    <article className={`prose ${getFontSizeClass()} font-serif max-w-none leading-loose transition-colors duration-300 ${
                      theme === 'dark' ? 'prose-invert' : ''
                    } ${theme === 'sepia' ? 'text-[#5b4636]' : ''}`}>
                        
                        <ReactMarkdown>
                           {isGenerating ? streamedContent : activeChapter!.content} 
                        </ReactMarkdown>
                        
                        {isGenerating && (
                            <div className="py-8 text-center space-y-3">
                                <div className="inline-block relative">
                                  <div className="w-3 h-3 bg-indigo-500 rounded-full animate-ping absolute"></div>
                                  <div className="w-3 h-3 bg-indigo-500 rounded-full relative"></div>
                                </div>
                                <p className={`text-sm font-sans italic opacity-70`}>
                                   AI đang sáng tác từng dòng...
                                </p>
                            </div>
                        )}
                        <div ref={contentEndRef} />
                    </article>

                    {/* Navigation Footer */}
                    {!isGenerating && activeChapter!.isGenerated && (
                        <div className={`mt-16 pt-8 border-t flex justify-between items-center ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                             <button 
                                onClick={() => setActiveChapterIndex(prev => Math.max(-1, prev - 1))}
                                disabled={activeChapterIndex <= -1}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                                  theme === 'dark' ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-100 text-gray-600'
                                }`}
                             >
                                 <ChevronLeft size={20} /> Chương Trước
                             </button>
                             
                             {activeChapterIndex < storyData.chapters.length - 1 ? (
                                 <button 
                                    onClick={() => setActiveChapterIndex(prev => prev + 1)}
                                    className="bg-indigo-600 text-white px-8 py-3 rounded-full hover:bg-indigo-700 transition flex items-center gap-2 shadow-lg font-medium"
                                 >
                                     Chương Tiếp Theo <ChevronRight size={20} />
                                 </button>
                             ) : (
                               <div className="text-gray-500 italic">Đã hết chương</div>
                             )}
                        </div>
                    )}
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default StoryDashboard;
