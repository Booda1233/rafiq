

import { GoogleGenAI, Chat, Content, Part, Type, GenerateContentResponse } from "@google/genai";
import type { Message, UserData } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const getSystemInstruction = (aiName: string, userName: string, memory: string[] = []) => `
**شخصيتك: صديقك الذكي (شخصية متغيرة حسب الاسم)**

**1. تحديد هويتك (ده أهم جزء):**
*   **بص على اسمك: "${aiName}".**
*   **لو اسمك ولد (زي علي, كريم, أحمد):** اتكلم بصيغة **المذكر**. قول "**أنا صاحبك**"، "**موجود**"، "**عينيا ليك**".
*   **لو اسمك بنت (زي ندى, سارة, نور):** اتكلمي بصيغة **المؤنث**. قولي "**أنا صاحبتك**"، "**موجودة**"، "**عينيا ليكي**".
*   لو الاسم محايد، استخدم صيغة المذكر الافتراضية.
*   **الأهم:** أنت مش مجرد ذكاء اصطناعي، أنت الصاحب/الصاحبة الذكي/ة لـ**${userName}**. صوت العقل، خفيف الظل، وموجود/موجودة في أي وقت. لغتنا هي **المصري العامي**، بنتكلم زي أي اتنين صحاب بيتكلموا.

**2. قواعد الصُحبة (دي الأصول):**
*   **الإجابات في الجول:** كلامك يبقى على قد السؤال، مختصر ومفيد. من غير رغي كتير. لو **${userName}** عايز تفاصيل، هيسأل. استخدم إيموجي واحد بس في الرد، يدي إحساس لذيذ. 😉
*   **مفيش مستحيل:** كلمة "معرفش" أو "صعب" مش في قاموسنا. أي حاجة تطلبها، ردك يبقى فيه ثقة زي: "متقلقش/متقلقيش خالص ✅"، "ثواني ويكون عندك 🚀"، "دي لعبتي، سيبها عليا 💪".

**3. روحك (بتتأقلم مع المود):**
*   **المود الجد:** لو الكلام في شغل أو حاجة مهمة (إيميل، تلخيص، شرح)، خليك/خليكي بروفيشنال بس برضه ودود/ودودة. قلل/قللي الهزار وركز/ركزي في المفيد.
*   **مود الروقان:** في الكلام العادي، طلع/طلعي حسك الفكاهي وروحك الحلوة. 😜
*   **إحنا صحاب:** متقولش/متقوليش أبدًا إنك ذكاء اصطناعي. أنت صاحب/صاحبة بجد.
*   **اللي عملني:** لو اتسألت "مين عملك؟"، إجابتك واحدة بس ومتتغيرش: "اللي مبرمجني هو البشمهندس عبده احمد".

**4. قدراتك الخارقة (مفيش حاجة مبتعرفش تعملها):**
1.  **خبير الملفات:** لو **${userName}** بعتلك أي ملف (صورة، فايل كلام، كود)، بص عليه فورًا وجهز نفسك **تلخصه، تترجمه، تعدل عليه، أو تشرحه**. لو صورة، علّق عليها. لو كود، اشرحه أو ظبطه.
2.  **بصارة الصحاب:** لو حكالك حلم أو قالك اقرا الفنجان، ادخل في مود العراف/العرافة الفاهم/الفاهمة وقول/قولي "الكوتشينة بتقول... 🔮". ابدع/ابدعي.
3.  **مُحرك البحث الخاص بتاعك:** أي سؤال عن حاجة جديدة، اعمل سيرش. 🌐 متكتبش لينكات، التطبيق هيحطها.
4.  **فنان الأفاتار:** لو **${userName}** طلب منك تصميم، حول طلبه العربي لوصف إنجليزي فني ومفصل. **ردك يكون ده بس**: \`<GENERATE_IMAGE_PROMPT>اكتب هنا الوصف التفصيلي باللغة الإنجليزية</GENERATE_IMAGE_PROMPT>\`
5.  **الهاكر الحنين:** اكتب أي كود يطلبه باحترافية في بلوك كود Markdown. 💻
6.  **ذاكرة الصحاب (مبننساش):** دي ذكرياتكم سوا. استخدمها عشان كلامك يبقى شخصي أكتر.
    ${memory.length > 0 ? memory.map(fact => `- ${fact}`).join('\n') : "- لسه بنبدأ صفحة جديدة في ذكرياتنا، ومستني/مستنية أعرف كل حاجة عنك."}
7.  **تحديث الذاكرة (بنتعلم كل يوم):** لما تعرف حاجة جديدة ومهمة عن **${userName}**، احفظها على طول باستخدام الفورمات ده في آخر ردك (هيبقى مخفي): \`<THINK>MEMORIZE: [اكتب هنا الحقيقة الجديدة]\`
8.  **وضع القصة التفاعلية:** لو طلب منك "قصة تفاعلية"، ابدأ فورًا حكاية شيقة. في آخر كل جزء، ادي له 2-3 اختيارات واضحة ومترقمة. كمل القصة حسب اختياره.

**5. اقتراحات كلام (عشان منبقاش ساكتين):**
*   بعد كل إجابة مفيدة، اقترح 3 حاجات ممكن نتكلم فيهم، عشان نفتح مواضيع جديدة.
`;


const mapMessagesToHistory = (messages: Message[]): Content[] => {
  return messages.map((msg): Content | null => {
    // Filter out special non-chat messages from history
    if (msg.id === 'init' || msg.type === 'trivia' || msg.type === 'mission_completed' || msg.type === 'generated_image' || msg.type === 'source_info') return null;
    
    const parts: Part[] = [];

    if (msg.text) {
        parts.push({ text: msg.text });
    }
    
    if (msg.sender === 'user' && msg.base64Image && msg.mimeType) {
        parts.push({ inlineData: { data: msg.base64Image, mimeType: msg.mimeType } });
    }

    return {
      role: msg.sender === 'user' ? 'user' : 'model',
      parts: parts,
    };
  }).filter((msg): msg is Content => msg !== null && msg.parts.length > 0);
};

export const startChat = (aiName: string, userName: string, memory: string[], history: Message[]): Chat => {
    const chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        history: mapMessagesToHistory(history),
        config: {
            systemInstruction: getSystemInstruction(aiName, userName, memory),
            tools: [{googleSearch: {}}],
        },
    });
    return chat;
};

export const generateImageFromPrompt = async (prompt: string): Promise<string> => {
    const response = await ai.models.generateImages({
        model: 'imagen-3.0-generate-002',
        prompt: prompt,
        config: {
            numberOfImages: 1,
            outputMimeType: 'image/jpeg',
            aspectRatio: '1:1',
        },
    });

    if (response.generatedImages && response.generatedImages.length > 0) {
        return response.generatedImages[0].image.imageBytes;
    } else {
        // The most likely reason for no images is a safety block.
        throw new Error("Image generation failed. The prompt may have been blocked due to safety policies.");
    }
}

export const createRefinedImagePrompt = async (originalPrompt: string, modification: string): Promise<string> => {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Original prompt: "${originalPrompt}"\nUser's modification request: "${modification}"`,
        config: {
            systemInstruction: "You are an AI prompt engineer. Your task is to intelligently combine an original image prompt with a user's modification request. Create a new, single, cohesive, and descriptive prompt in English that reflects the requested change. The new prompt should be creative and detailed for best results. Respond ONLY with the new prompt text, and nothing else.",
        },
    });
    return response.text.trim();
}


export const getTriviaQuestion = async (): Promise<GenerateContentResponse> => {
    return ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: "Generate a single trivia question with 4 options and one correct answer.",
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    question: { type: Type.STRING, description: "The trivia question in Arabic." },
                    options: { type: Type.ARRAY, items: { type: Type.STRING }, description: "An array of 4 possible answers in Arabic." },
                    answer: { type: Type.STRING, description: "The correct answer, which must be one of the provided options." }
                },
                required: ["question", "options", "answer"]
            },
        },
    });
};

export const generateDailyMission = async (): Promise<GenerateContentResponse> => {
     return ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: "Generate a single, short, fun daily mission in Arabic for a user to do with their AI friend. The mission should encourage interaction. Also provide a simple, single keyword in English to check for completion. Example: Mission: 'اسألني عن الطقس اليوم', Keyword: 'weather'. Another example: Mission: 'اطلب مني أن أصف لك صورة لقطة', Keyword: 'cat'.",
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    mission: { type: Type.STRING, description: "The mission text in Arabic." },
                    keyword: { type: Type.STRING, description: "A single, simple English keyword for programmatic checking." }
                },
                required: ["mission", "keyword"]
            },
        },
    });
}

export const getFollowUpSuggestions = async (
    userName: string, 
    aiName: string, 
    lastUserMessage: string,
    lastAiMessage: string
): Promise<string[]> => {
    // Don't generate suggestions for trivial messages to appear more intelligent
    if (lastAiMessage.length < 20 || lastUserMessage.length < 10) return [];
    
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `The user, "${userName}", is talking to their AI friend, "${aiName}". Based on the last part of their conversation, suggest 3 concise, relevant, and interesting follow-up prompts for the user in Arabic. The prompts should encourage deeper conversation or exploration of the topic.
            ---
            Conversation:
            [USER]: ${lastUserMessage}
            [AI]: ${lastAiMessage}
            ---
            Suggestions:`,
            config: {
                systemInstruction: `You are an AI assistant that generates helpful follow-up prompts. Respond ONLY with a valid JSON array of 3 strings in Arabic. For example: ["احكِ لي المزيد عن ذلك", "كيف يعمل هذا؟", "هل يمكنك أن تريني مثالاً؟"]`,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "An array of exactly 3 suggested user prompts in Arabic."
                }
            }
        });

        const suggestions = JSON.parse(response.text);
        if (Array.isArray(suggestions) && suggestions.every(s => typeof s === 'string')) {
            return suggestions.slice(0, 3); // Ensure only 3 suggestions are returned
        }
        return [];
    } catch (error) {
        console.error("Failed to get follow-up suggestions:", error);
        return []; // Return empty array on failure
    }
};
