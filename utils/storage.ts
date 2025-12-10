import { StoryData } from '../types';

const STORAGE_KEY = 'ai_novelist_stories_v1';

export const saveStoryToLocal = (story: StoryData): boolean => {
  try {
    const existing = getSavedStories();
    const index = existing.findIndex(s => s.id === story.id);
    
    // Cập nhật timestamp
    const storyToSave = { ...story, lastUpdated: Date.now() };

    if (index >= 0) {
      existing[index] = storyToSave;
    } else {
      existing.unshift(storyToSave);
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
    return true;
  } catch (e) {
    console.error("Lỗi khi lưu truyện (có thể do hết bộ nhớ LocalStorage):", e);
    return false;
  }
};

export const getSavedStories = (): StoryData[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const deleteStoryFromLocal = (id: string) => {
  try {
    const existing = getSavedStories();
    const filtered = existing.filter(s => s.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.error("Lỗi khi xóa truyện:", e);
  }
};
