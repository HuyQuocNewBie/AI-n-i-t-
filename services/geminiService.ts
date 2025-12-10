import { GoogleGenAI, Type, Schema } from "@google/genai";
import { StoryConfig, Chapter, Genre, StoryData } from "../types";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

// Model cho text logic cao (Giữ nguyên Pro để viết hay)
const TEXT_MODEL = "gemini-3-pro-preview";

// FIX ERROR 403: Chuyển sang model Flash Image ổn định hơn và quyền truy cập rộng hơn
const IMAGE_MODEL = "gemini-2.5-flash-image";

interface OutlineResponse {
  title: string;
  longDescription: string;
  chapters: Chapter[];
}

// Helper: Chọn giọng văn dựa trên thể loại (Simplified for single genre string)
const getStyleGuide = (genre: string, subGenres: string[] = []) => {
  const g = genre.toLowerCase();
  const subs = subGenres.join(", ").toLowerCase();
  
  // Combine logic to find best match
  const combined = g + " " + subs;

  // Nhóm Cổ Trang / Tu Tiên
  if (combined.includes("cổ") || combined.includes("tiên") || combined.includes("huyền") || combined.includes("kiếm") || combined.includes("đế") || combined.includes("vương") || combined.includes("xuyên không")) {
    return "Văn phong bán cổ trang (Hán Việt vừa phải), hào hùng, dùng từ ngữ tu từ, tả cảnh thiên nhiên hùng vĩ, chiêu thức võ công miêu tả chi tiết, hoa mỹ.";
  }

  // Nhóm Kinh Dị / Trinh Thám
  if (combined.includes("kinh dị") || combined.includes("ma") || combined.includes("quỷ") || combined.includes("án") || combined.includes("trinh thám") || combined.includes("zombie") || combined.includes("mạt thế")) {
    return "Bầu không khí u tối, gay cấn, dồn dập, tập trung vào các chi tiết rùng rợn qua 5 giác quan (âm thanh, mùi vị...), tạo cảm giác hồi hộp đè nén.";
  }

  // Nhóm Ngôn Tình / Tình Cảm / Đam Mỹ
  if (combined.includes("ngôn") || combined.includes("tình") || combined.includes("yêu") || combined.includes("sủng") || combined.includes("ngược") || combined.includes("hôn") || combined.includes("thanh xuân") || combined.includes("boylove") || combined.includes("đam") || combined.includes("bách") || combined.includes("cưới")) {
    return "Ngôn từ mượt mà, giàu cảm xúc, tập trung sâu vào miêu tả nội tâm nhân vật, những rung động tinh tế, nhịp độ chậm rãi lắng đọng, lãng mạn.";
  }

  // Nhóm Hài
  if (combined.includes("hài")) {
    return "Giọng văn dí dỏm, hài hước, có chút châm biếm, sử dụng tình huống gây cười tự nhiên qua đối thoại.";
  }

  // Default: Yêu cầu AI tự thích ứng
  return `Hãy sử dụng giọng văn đặc trưng và phù hợp nhất với thể loại "${genre}" và các yếu tố "${subGenres.join(', ')}". Viết thật lôi cuốn, văn phong chuyên nghiệp.`;
};

// --- NEW FUNCTION: Generate Premise Idea ---
export const generatePremiseIdea = async (genre: string, subGenres: string[]): Promise<string> => {
  const ai = getAI();
  const subGenresString = subGenres.join(", ");
  
  const prompt = `
    Bạn là một trợ lý sáng tạo nội dung tiểu thuyết.
    
    NHIỆM VỤ: 
    Hãy sáng tạo một Cốt truyện sơ lược (Idea/Premise) thật hấp dẫn, độc đáo, có "hook" (điểm lôi cuốn) cho một bộ truyện mới.
    
    THÔNG TIN:
    - Thể loại chính: ${genre}
    - Các yếu tố/Tags: ${subGenresString}
    
    YÊU CẦU OUTPUT:
    - Chỉ trả về nội dung cốt truyện.
    - Độ dài: Khoảng 300-500 từ.
    - Nội dung phải kịch tính, giới thiệu được nhân vật chính, mâu thuẫn chính và bối cảnh độc đáo.
    - Viết bằng tiếng Việt trôi chảy.
  `;

  try {
    const response = await ai.models.generateContent({
      model: TEXT_MODEL,
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 1024 },
        temperature: 1.2, // Tăng độ sáng tạo cao
      },
    });
    return response.text || "";
  } catch (error) {
    console.error("Error generating premise:", error);
    throw error;
  }
};

export const generateStoryMetadataAndOutline = async (config: StoryConfig): Promise<OutlineResponse> => {
  const ai = getAI();
  const genreString = config.genre;
  const subGenresString = config.subGenres.length > 0 ? config.subGenres.join(", ") : "Không có";

  const titleInstruction = config.title 
    ? `Tên truyện mong muốn: ${config.title}`
    : `Tên truyện: CHƯA CÓ. Hãy SÁNG TẠO MỘT TÊN TRUYỆN thật hay, "kêu", độc lạ, chuẩn phong cách ${genreString}.`;

  // Xử lý logic Truyện ngắn vs Truyện dài
  let lengthInstruction = "";
  // Ngưỡng số chương để AI tạo dàn ý chi tiết. Nếu nhiều hơn, phần còn lại sẽ được auto-fill.
  const AI_OUTLINE_LIMIT = 20;

  if (config.storyType === 'short') {
    lengthInstruction = `
    - Đây là TRUYỆN NGẮN. Bạn có toàn quyền quyết định số lượng chương.
    - Hãy tự ước lượng số chương sao cho phù hợp với cốt truyện (thường từ 2 đến 10 chương).
    `;
  } else {
    lengthInstruction = `
    - Đây là TRUYỆN DÀI (Tiểu thuyết dài kỳ).
    - Tổng số chương dự kiến: ${config.totalChapters}.
    - QUAN TRỌNG: Nếu tổng số chương > ${AI_OUTLINE_LIMIT}, bạn CHỈ CẦN lập dàn ý chi tiết cho ${AI_OUTLINE_LIMIT} chương đầu tiên.
    - TUYỆT ĐỐI KHÔNG GỘP CHƯƠNG (Ví dụ: CẤM viết "Chương 4-10"). Phải tách riêng từng chương một.
    - Độ dài mục tiêu mỗi chương: ${config.targetWordCountPerChapter} từ.
    `;
  }

  const prompt = `
    Bạn là một tiểu thuyết gia đại tài và biên tập viên cấp cao.
    
    THÔNG TIN ĐẦU VÀO:
    ${titleInstruction}
    - Thể loại chính: ${genreString}
    - Phân loại chi tiết / Tags: ${subGenresString} (QUAN TRỌNG: Hãy lồng ghép các yếu tố này vào cốt truyện)
    - Ý tưởng ban đầu: ${config.premise}
    
    CẤU TRÚC TRUYỆN:
    ${lengthInstruction}
    
    YÊU CẦU OUTPUT:
    1. Title: Đặt tên truyện ấn tượng (nếu chưa có).
    2. Long Description: Viết văn án giới thiệu truyện. YÊU CẦU: Ngắn gọn, súc tích, gây tò mò, độ dài KHOẢNG 215 TỪ.
    3. Chapters: Lập dàn ý chi tiết các chương. Cấu trúc chương phải có cao trào, thắt nút mở nút hợp lý.

    Trả về JSON theo schema.
  `;

  const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING },
      longDescription: { type: Type.STRING, description: "Văn án giới thiệu truyện khoảng 215 từ" },
      chapters: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            chapterNumber: { type: Type.INTEGER },
            title: { type: Type.STRING },
            summary: { type: Type.STRING },
          },
          required: ["chapterNumber", "title", "summary"],
        },
      }
    },
    required: ["title", "longDescription", "chapters"],
  };

  try {
    const response = await ai.models.generateContent({
      model: TEXT_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        thinkingConfig: { thinkingBudget: 2048 },
        temperature: 1, 
      },
    });

    const data = JSON.parse(response.text || "{}");
    
    if (!data.chapters || !Array.isArray(data.chapters)) {
      throw new Error("Invalid response format from AI");
    }

    const processedChapters = data.chapters.map((c: any, index: number) => {
      // CLEAN TITLE: Loại bỏ "Chương X", "Chapter X" ở đầu tiêu đề nếu có
      let cleanTitle = c.title.replace(/^(Chương|Chapter|Hồi)\s+\d+[:.\-]?\s*/i, "").trim();
      // Loại bỏ các dạng range như "4-10" nếu AI vẫn cố tình trả về
      cleanTitle = cleanTitle.replace(/^\d+[-–]\d+[:.\-]?\s*/, "").trim();

      return {
        ...c,
        title: cleanTitle || `Chương ${index + 1}`,
        chapterNumber: index + 1, // FORCE sequential numbering (1, 2, 3...)
        content: "",
        isGenerated: false,
      };
    });

    // LOGIC TỰ ĐỘNG ĐIỀN (AUTO-FILL) CHO TRUYỆN DÀI
    // Nếu tổng số chương mong muốn lớn hơn số chương AI đã tạo (do giới hạn token),
    // ta sẽ tự động thêm các chương giữ chỗ (Placeholders).
    if (config.storyType === 'long' && config.totalChapters && config.totalChapters > processedChapters.length) {
        const currentCount = processedChapters.length;
        const targetCount = config.totalChapters;
        
        for (let i = currentCount + 1; i <= targetCount; i++) {
             processedChapters.push({
                chapterNumber: i,
                title: `Chương ${i}`, 
                summary: "Nội dung sẽ được sáng tạo tiếp nối các chương trước một cách logic.", // Placeholder summary
                content: "",
                isGenerated: false,
             });
        }
    }

    return {
      title: data.title || config.title || "Vô Đề",
      longDescription: data.longDescription || config.premise,
      chapters: processedChapters
    };

  } catch (error) {
    console.error("Error generating outline:", error);
    throw error;
  }
};

export const generateCoverImage = async (title: string, genre: string, description: string): Promise<string | undefined> => {
  const ai = getAI();
  
  // Prompt tối ưu: CẤM Text, chỉ tập trung vào hình ảnh
  const prompt = `
    Do not render any text, title or words on the image.
    Novel book cover art. 
    Genre: ${genre}.
    Theme/Mood: ${description.slice(0, 150)}.
    Style: High quality digital illustration, cinematic lighting, detailed background, masterpiece, 8k.
    IMPORTANT: COMPLETELY TEXTLESS. NO WORDS, NO TITLE, NO TYPOGRAPHY ON THE IMAGE.
  `;

  try {
    const response = await ai.models.generateContent({
      model: IMAGE_MODEL,
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        imageConfig: {
            aspectRatio: "3:4", 
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return part.inlineData.data;
      }
    }
    return undefined;
  } catch (error) {
    console.warn("Could not generate cover image (Check API permissions):", error);
    return undefined;
  }
};

export const generateChapterContentStream = async (
  config: StoryConfig | StoryData,
  currentChapter: Chapter,
  previousChapter: Chapter | null,
  fullOutline: Chapter[]
): Promise<AsyncIterable<string>> => {
  const ai = getAI();
  const genreString = config.genre;
  const subGenresString = config.subGenres.length > 0 ? config.subGenres.join(", ") : "";
  const styleGuide = getStyleGuide(config.genre, config.subGenres);

  // Lọc context từ các chương xung quanh (tránh gửi hết 500 chương outline gây tốn token)
  const nearbyChapters = fullOutline.filter(c => 
      Math.abs(c.chapterNumber - currentChapter.chapterNumber) <= 5
  );
  
  const outlineContext = nearbyChapters
    .map(c => `Chương ${c.chapterNumber}: ${c.title} - ${c.summary}`)
    .join("\n");

  const prevContext = previousChapter && previousChapter.isGenerated
    ? `CHƯƠNG TRƯỚC VỪA KẾT THÚC NHƯ SAU:\n...${previousChapter.content.slice(-1500)}`
    : "Đây là chương mở đầu.";

  let lengthPrompt = "";
  if (config.storyType === 'short') {
     lengthPrompt = "- Độ dài: Hãy viết độ dài vừa phải, phù hợp với diễn biến (khoảng 1000-2000 từ).";
  } else {
     lengthPrompt = `- Độ dài mục tiêu: Tối thiểu ${config.targetWordCountPerChapter} từ. Hãy viết thật dài, thật sâu.`;
  }

  // Nếu summary là placeholder, nhắc AI tự sáng tạo tiếp
  const isPlaceholderSummary = currentChapter.summary.includes("Nội dung sẽ được sáng tạo tiếp nối");
  const specificSummaryInstruction = isPlaceholderSummary 
    ? "Hiện chưa có tóm tắt chi tiết cho chương này. Hãy TỰ DO SÁNG TẠO diễn biến tiếp theo một cách logic, hấp dẫn, tiếp nối mạch truyện của chương trước."
    : `Cốt truyện chính của chương: ${currentChapter.summary}`;

  const systemInstruction = `
  // --- ĐỊNH DANH ---
  Bạn là một tiểu thuyết gia đại tài.

  // --- NGUYÊN TẮC ---
  1. SHOW, DON'T TELL.
  2. DEEP POV (Góc nhìn sâu).
  3. BỐI CẢNH ĐA GIÁC QUAN.
  4. KHÔNG chào hỏi, KHÔNG mở bài thừa thãi. Vào thẳng nội dung truyện.
  `;

  const prompt = `
    HÃY VIẾT NỘI DUNG CHI TIẾT CHO CHƯƠNG SAU.

    THÔNG TIN:
    - Tên truyện: ${config.title}
    - Thể loại: ${genreString}
    - Tags: ${subGenresString}
    - PHONG CÁCH: ${styleGuide}
    
    YÊU CẦU CỤ THỂ:
    - Chương số: ${currentChapter.chapterNumber}
    - Tiêu đề: ${currentChapter.title}
    - ${specificSummaryInstruction}
    ${lengthPrompt}
    
    BỐI CẢNH (Các chương lân cận):
    ${outlineContext}
    
    KẾT NỐI VỚI CHƯƠNG TRƯỚC:
    ${prevContext}
    
    BẮT ĐẦU VIẾT NGAY.
  `;

  try {
    const responseStream = await ai.models.generateContentStream({
      model: TEXT_MODEL,
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        thinkingConfig: { thinkingBudget: 8192 },
        temperature: 1, 
        topK: 64, 
        topP: 0.95,
      }
    });

    async function* streamGenerator() {
      for await (const chunk of responseStream) {
        if (chunk.text) {
          yield chunk.text;
        }
      }
    }

    return streamGenerator();

  } catch (error) {
    console.error("Error streaming chapter:", error);
    throw error;
  }
};
