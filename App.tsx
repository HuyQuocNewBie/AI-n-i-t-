import React, { useState, useEffect } from 'react';
import { StoryConfig, StoryData } from './types';
import { generateStoryMetadataAndOutline, generateCoverImage } from './services/geminiService';
import { saveStoryToLocal, getSavedStories, deleteStoryFromLocal } from './utils/storage';
import StoryForm from './components/StoryForm';
import StoryDashboard from './components/StoryDashboard';
import StoryLibrary from './components/StoryLibrary';

const App: React.FC = () => {
  const [step, setStep] = useState<'config' | 'dashboard' | 'library'>('config');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [storyData, setStoryData] = useState<StoryData | null>(null);
  
  // State để check xem có truyện đã lưu không (để hiện nút thư viện)
  const [hasSavedStories, setHasSavedStories] = useState(false);

  useEffect(() => {
    // Check nếu có truyện lưu
    const saved = getSavedStories();
    setHasSavedStories(saved.length > 0);
  }, [step]); // Re-check khi chuyển trang

  const handleConfigSubmit = async (config: StoryConfig) => {
    setIsLoading(true);
    try {
      // Step 1: Generate Metadata & Outline
      setLoadingStep("Đang lên ý tưởng & viết văn án...");
      const outlineData = await generateStoryMetadataAndOutline(config);

      // Step 2: Generate Cover Image (dependent on title/desc)
      setLoadingStep("Đang vẽ bìa truyện...");
      const coverImage = await generateCoverImage(
        outlineData.title, 
        config.genre, 
        outlineData.longDescription
      );
      
      const newStory: StoryData = {
        id: crypto.randomUUID(), // Tạo ID duy nhất
        ...config,
        title: outlineData.title,
        longDescription: outlineData.longDescription,
        coverImage: coverImage,
        chapters: outlineData.chapters,
        createdAt: Date.now(),
        lastUpdated: Date.now(),
      };
      
      setStoryData(newStory);
      setStep('dashboard');
    } catch (error) {
      console.error(error);
      alert("Không thể khởi tạo truyện. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
      setLoadingStep("");
    }
  };

  const handleUpdateChapter = (chapterIndex: number, content: string, isGenerated: boolean) => {
    if (!storyData) return;

    if (chapterIndex < 0) return;

    const updatedChapters = [...storyData.chapters];
    updatedChapters[chapterIndex] = {
      ...updatedChapters[chapterIndex],
      content,
      isGenerated,
    };

    const updatedStory = {
      ...storyData,
      chapters: updatedChapters,
      lastUpdated: Date.now(),
    };

    setStoryData(updatedStory);
  };

  const handleSaveStory = () => {
    if (storyData) {
      saveStoryToLocal(storyData);
      setHasSavedStories(true);
    }
  };

  // Handler cho Library
  const handleSelectStory = (story: StoryData) => {
    setStoryData(story);
    setStep('dashboard');
  };

  const handleDeleteStory = (id: string) => {
    deleteStoryFromLocal(id);
    // Force re-render library list by toggling step or using local state within Library
    // Ở đây đơn giản nhất là set lại state trong Library, nhưng vì Library lấy data trực tiếp mỗi lần render hoặc qua props
    // Ta cần update danh sách.
    // Cách đơn giản: Force update lại component App (đã dùng useEffect check hasSavedStories, nhưng cần re-fetch list cho Library)
    // Để tối ưu, StoryLibrary nên quản lý list của nó hoặc App quản lý list state. 
    // Tuy nhiên để giữ code đơn giản, ta sẽ chỉ re-render.
    const saved = getSavedStories();
    setHasSavedStories(saved.length > 0);
  };

  // Helper render Library with fresh data
  const renderLibrary = () => {
    const stories = getSavedStories();
    return (
      <StoryLibrary 
        stories={stories} 
        onSelectStory={handleSelectStory}
        onDeleteStory={(id) => {
          handleDeleteStory(id);
          // Hack nhỏ để re-render list ngay lập tức
          setStep('config'); 
          setTimeout(() => setStep('library'), 0);
        }}
        onBack={() => setStep('config')}
      />
    );
  };

  return (
    <div className="min-h-screen font-sans text-gray-900 bg-gray-100">
      {step === 'config' && (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-indigo-50 to-purple-50">
          <StoryForm 
            onSubmit={handleConfigSubmit} 
            onOpenLibrary={() => setStep('library')}
            isLoading={isLoading} 
            loadingStep={loadingStep}
            hasSavedStories={hasSavedStories}
          />
        </div>
      )}

      {step === 'library' && (
        <div className="min-h-screen bg-gray-50">
          {renderLibrary()}
        </div>
      )}

      {step === 'dashboard' && storyData && (
        <StoryDashboard
          storyData={storyData}
          onUpdateChapter={handleUpdateChapter}
          onSave={handleSaveStory}
          onBack={() => setStep('config')}
        />
      )}
    </div>
  );
};

export default App;
