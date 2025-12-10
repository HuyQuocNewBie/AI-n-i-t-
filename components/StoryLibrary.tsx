import React from 'react';
import { StoryData } from '../types';
import { BookOpen, Trash2, Calendar, Clock, ArrowLeft, Plus } from 'lucide-react';

interface StoryLibraryProps {
  stories: StoryData[];
  onSelectStory: (story: StoryData) => void;
  onDeleteStory: (id: string) => void;
  onBack: () => void;
}

const StoryLibrary: React.FC<StoryLibraryProps> = ({ stories, onSelectStory, onDeleteStory, onBack }) => {
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-12">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-200 rounded-full transition">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-3xl font-bold text-gray-800">Thư Viện Của Bạn</h1>
        </div>
        <button 
          onClick={onBack} 
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-full font-medium flex items-center gap-2 shadow-md transition"
        >
          <Plus size={20} /> Viết Truyện Mới
        </button>
      </div>

      {stories.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
          <BookOpen size={64} className="mx-auto text-gray-300 mb-4" />
          <p className="text-xl text-gray-500 mb-2">Chưa có truyện nào được lưu.</p>
          <p className="text-gray-400">Hãy sáng tác tác phẩm đầu tiên của bạn ngay!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {stories.map((story) => (
            <div 
              key={story.id} 
              className="bg-white rounded-xl shadow-sm hover:shadow-xl border border-gray-100 overflow-hidden transition-all duration-300 group flex flex-col h-full"
            >
              {/* Cover Area */}
              <div 
                onClick={() => onSelectStory(story)}
                className="h-48 bg-gray-200 relative overflow-hidden cursor-pointer"
              >
                {story.coverImage ? (
                  <img 
                    src={`data:image/png;base64,${story.coverImage}`} 
                    alt={story.title} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-indigo-50 text-indigo-300">
                    <BookOpen size={40} />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                   <span className="text-white font-medium text-sm">Tiếp tục đọc</span>
                </div>
              </div>

              {/* Info Area */}
              <div className="p-5 flex flex-col flex-1">
                <div className="mb-2">
                   <div className="flex flex-wrap gap-1 mb-2 max-h-16 overflow-hidden">
                        <span className="text-[10px] uppercase font-bold text-white bg-indigo-600 px-2 py-0.5 rounded truncate max-w-full">
                          {story.genre || "Chưa phân loại"}
                        </span>
                        {story.subGenres && story.subGenres.slice(0, 3).map(tag => (
                          <span key={tag} className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded truncate max-w-full">
                            {tag}
                          </span>
                        ))}
                        {story.subGenres && story.subGenres.length > 3 && (
                          <span className="text-[10px] text-gray-400 px-1">+{story.subGenres.length - 3}</span>
                        )}
                   </div>
                   <h3 
                      onClick={() => onSelectStory(story)}
                      className="text-xl font-bold text-gray-900 mb-1 cursor-pointer hover:text-indigo-600 transition line-clamp-1" 
                      title={story.title}
                   >
                     {story.title}
                   </h3>
                </div>

                <p className="text-gray-500 text-sm mb-4 line-clamp-3 flex-1">
                  {story.premise}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100 text-xs text-gray-400">
                  <div className="flex items-center gap-1">
                    <Clock size={12} />
                    <span>{formatDate(story.lastUpdated)}</span>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm("Bạn có chắc chắn muốn xóa truyện này không?")) {
                        onDeleteStory(story.id);
                      }
                    }}
                    className="text-gray-400 hover:text-red-500 p-1.5 hover:bg-red-50 rounded transition"
                    title="Xóa truyện"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StoryLibrary;
