import React, { useState, useMemo } from 'react';
import { GENRES, SUB_GENRES, Genre, StoryConfig, StoryType } from '../types';
import { generatePremiseIdea } from '../services/geminiService';
import { BookOpen, PenTool, Sparkles, Library, Feather, ScrollText, AlertCircle, Search, X, Wand2 } from 'lucide-react';

interface StoryFormProps {
  onSubmit: (config: StoryConfig) => void;
  onOpenLibrary: () => void;
  isLoading: boolean;
  loadingStep?: string;
  hasSavedStories: boolean;
}

const StoryForm: React.FC<StoryFormProps> = ({ onSubmit, onOpenLibrary, isLoading, loadingStep, hasSavedStories }) => {
  const [title, setTitle] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<Genre>(GENRES[0]);
  const [premise, setPremise] = useState('');
  
  // Tag Selection State
  const [selectedSubGenres, setSelectedSubGenres] = useState<string[]>([]);
  const [tagSearch, setTagSearch] = useState('');

  // AI Idea Generation State
  const [isGeneratingIdea, setIsGeneratingIdea] = useState(false);

  // New State for Story Type
  const [storyType, setStoryType] = useState<StoryType>('long');
  const [totalChapters, setTotalChapters] = useState(10);
  const [wordCount, setWordCount] = useState(1500);

  // Word count validation (UPDATED to 500 words for Premise)
  const getWordCount = (text: string) => text.trim().split(/\s+/).filter(w => w.length > 0).length;
  const currentWordCount = getWordCount(premise);
  const isWordCountValid = currentWordCount <= 500;

  // Filter tags based on search
  const filteredTags = useMemo(() => {
    if (!tagSearch) return SUB_GENRES;
    return SUB_GENRES.filter(tag => tag.toLowerCase().includes(tagSearch.toLowerCase()));
  }, [tagSearch]);

  const toggleTag = (tag: string) => {
    if (selectedSubGenres.includes(tag)) {
      setSelectedSubGenres(prev => prev.filter(t => t !== tag));
    } else {
      if (selectedSubGenres.length >= 4) {
        alert("Bạn chỉ được chọn tối đa 4 phân loại.");
        return;
      }
      setSelectedSubGenres(prev => [...prev, tag]);
    }
  };

  const handleGenerateIdea = async () => {
    if (selectedSubGenres.length === 0) return;
    
    setIsGeneratingIdea(true);
    setPremise("Đang tìm kiếm ý tưởng triệu đô..."); // Placeholder effect
    
    try {
      const generatedIdea = await generatePremiseIdea(selectedGenre, selectedSubGenres);
      setPremise(generatedIdea);
    } catch (error) {
      console.error(error);
      alert("Lỗi khi tạo ý tưởng. Vui lòng thử lại.");
      setPremise("");
    } finally {
      setIsGeneratingIdea(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isWordCountValid) {
      alert("Mô tả cốt truyện không được quá 500 từ.");
      return;
    }

    const config: StoryConfig = {
      title,
      genre: selectedGenre,
      subGenres: selectedSubGenres,
      premise,
      storyType,
      totalChapters: storyType === 'long' ? totalChapters : undefined,
      targetWordCountPerChapter: storyType === 'long' ? wordCount : undefined,
    };
    
    onSubmit(config);
  };

  // Logic to enable magic button: selectedGenre is always set by default, so we mainly check subGenres
  const isIdeaGeneratorEnabled = selectedSubGenres.length > 0 && !isGeneratingIdea;

  return (
    <div className="w-full max-w-3xl">
       {/* Header with Library Link */}
       {hasSavedStories && (
        <div className="flex justify-end mb-4">
          <button 
            onClick={onOpenLibrary}
            className="flex items-center gap-2 text-indigo-600 bg-white px-4 py-2 rounded-full shadow-sm hover:shadow-md hover:bg-indigo-50 transition font-medium text-sm"
          >
            <Library size={18} /> Thư Viện Truyện Đã Lưu
          </button>
        </div>
       )}

      <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
        <div className="text-center mb-8">
          <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-600">
            <BookOpen size={32} />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Khởi Tạo Kiệt Tác</h1>
          <p className="text-gray-500">Mô tả ý tưởng, chọn thể loại và để AI xây dựng thế giới cho bạn.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Story Type Selection */}
          <div className="grid grid-cols-2 gap-4 p-1 bg-gray-100 rounded-xl">
            <button
              type="button"
              onClick={() => setStoryType('short')}
              className={`flex items-center justify-center gap-2 py-3 rounded-lg font-bold transition-all ${
                storyType === 'short' 
                  ? 'bg-white text-indigo-600 shadow-md' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Feather size={18} /> Truyện Ngắn
            </button>
            <button
              type="button"
              onClick={() => setStoryType('long')}
              className={`flex items-center justify-center gap-2 py-3 rounded-lg font-bold transition-all ${
                storyType === 'long' 
                  ? 'bg-white text-indigo-600 shadow-md' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <ScrollText size={18} /> Truyện Dài
            </button>
          </div>
          
          <div className="text-center text-sm text-gray-500 -mt-4 italic">
            {storyType === 'short' 
              ? "AI sẽ tự động ước lượng độ dài và số chương phù hợp với cốt truyện." 
              : "Bạn có quyền kiểm soát số lượng chương và độ dài mỗi chương."}
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tên tác phẩm <span className="text-gray-400 font-normal">(Để trống nếu muốn AI tự đặt tên)</span>
            </label>
            <input
              type="text"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              placeholder="Ví dụ: Đại Đạo Tranh Phong (hoặc bỏ trống)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Genre Selection Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Main Genre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Thể loại chính (Chọn 1)</label>
              <div className="relative">
                <select
                  value={selectedGenre}
                  onChange={(e) => setSelectedGenre(e.target.value as Genre)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition bg-white appearance-none cursor-pointer"
                >
                  {GENRES.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </div>

            {/* Sub-Genres / Tags */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2 flex justify-between">
                <span>Phân loại chi tiết (Chọn tối đa 4)</span>
                <span className="text-indigo-600 font-bold">{selectedSubGenres.length}/4</span>
              </label>
              
              <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                {/* Search Input */}
                <div className="relative mb-3">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                   <input 
                      type="text" 
                      placeholder="Tìm kiếm phân loại (ví dụ: Hệ thống, BTS, Sủng...)"
                      className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={tagSearch}
                      onChange={(e) => setTagSearch(e.target.value)}
                   />
                </div>

                {/* Selected Tags Display */}
                {selectedSubGenres.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4 p-2 bg-white rounded-lg border border-dashed border-indigo-200">
                    {selectedSubGenres.map(tag => (
                      <span key={tag} className="inline-flex items-center gap-1 bg-indigo-100 text-indigo-700 px-2 py-1 rounded text-xs font-bold animate-in zoom-in">
                        {tag} <button type="button" onClick={() => toggleTag(tag)}><X size={12} /></button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Tags Grid */}
                <div className="h-48 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 pr-2 custom-scrollbar">
                  {filteredTags.map((tag) => {
                    const isSelected = selectedSubGenres.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={`text-left text-xs px-3 py-2 rounded-md transition-all ${
                          isSelected 
                            ? 'bg-indigo-600 text-white shadow-md' 
                            : 'bg-white hover:bg-gray-200 text-gray-700 border border-gray-100'
                        }`}
                      >
                        {tag}
                      </button>
                    )
                  })}
                  {filteredTags.length === 0 && (
                    <div className="col-span-full text-center text-gray-500 text-sm py-4">
                      Không tìm thấy phân loại nào phù hợp.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Settings Grid - Only Show if Long Story */}
          {storyType === 'long' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Độ dài (từ/chương)</label>
                <input
                  type="number"
                  min={500}
                  max={5000}
                  step={100}
                  value={wordCount}
                  onChange={(e) => setWordCount(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Số lượng chương</label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={totalChapters}
                  onChange={(e) => setTotalChapters(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}

          {/* Premise */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-gray-700">Cốt truyện sơ lược / Ý tưởng <span className="text-red-500">*</span></label>
              <span className={`text-xs font-bold ${!isWordCountValid ? 'text-red-600' : 'text-gray-500'}`}>
                {currentWordCount}/500 từ
              </span>
            </div>
            
            <div className="relative">
              <textarea
                required
                rows={5}
                className={`w-full px-4 py-3 rounded-lg border focus:ring-2 transition pb-10 ${
                  !isWordCountValid 
                    ? 'border-red-300 focus:ring-red-200 focus:border-red-500' 
                    : 'border-gray-300 focus:ring-indigo-500 focus:border-transparent'
                }`}
                placeholder="Mô tả ngắn gọn về nhân vật chính, bối cảnh và mục tiêu..."
                value={premise}
                onChange={(e) => setPremise(e.target.value)}
              />
              
              {/* Magic Button for AI Idea Generation */}
              <button
                type="button"
                onClick={handleGenerateIdea}
                disabled={!isIdeaGeneratorEnabled}
                title={isIdeaGeneratorEnabled ? "Tạo ý tưởng tự động dựa trên thể loại" : "Vui lòng chọn phân loại chi tiết trước"}
                className={`absolute bottom-3 right-3 p-2 rounded-full shadow-lg transition-all transform duration-300 flex items-center justify-center ${
                  isIdeaGeneratorEnabled 
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:scale-110 hover:shadow-purple-200/50 cursor-pointer' 
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                {isGeneratingIdea ? (
                   <Sparkles className="animate-spin" size={18} />
                ) : (
                   <Wand2 size={18} />
                )}
              </button>
            </div>

            {!isWordCountValid && (
              <div className="mt-2 flex items-center gap-1 text-sm text-red-600 animate-pulse">
                <AlertCircle size={14} />
                <span>Mô tả quá dài! Vui lòng rút ngắn xuống dưới 500 từ.</span>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !isWordCountValid}
            className={`w-full py-4 rounded-xl text-white font-bold text-lg shadow-lg flex items-center justify-center gap-2 transition-all transform hover:scale-[1.01] ${
              isLoading || !isWordCountValid ? 'bg-gray-400 cursor-not-allowed transform-none' : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700'
            }`}
          >
            {isLoading ? (
              <>
                <Sparkles className="animate-spin" /> {loadingStep || "Đang Xử Lý..."}
              </>
            ) : (
              <>
                <PenTool /> Bắt Đầu Sáng Tác
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default StoryForm;