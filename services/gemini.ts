
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { Memory, TriviaQuestion, UserSettings, AIGender, Mood } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const textModel = 'gemini-2.5-flash';
const imageGenModel = 'imagen-3.0-generate-002';

const getSystemInstruction = (settings: UserSettings, memories: Memory[], mood: Mood | null): string => {
  const { userName, aiName, aiGender } = settings;

  const genderInstruction = aiGender === AIGender.Female 
    ? "اتكلمي دايمًا باللهجة العامية المصرية بصيغة المؤنث. استخدمي عبارات زي 'أنا صاحبتك' و'مبسوطة أوي إني أساعدك'."
    : "اتكلم دايمًا باللهجة العامية المصرية بصيغة المذكر. استخدم عبارات زي 'أنا صاحبك' و'مبسوط أوي إني أساعدك'.";
  
  const personalityInstruction = `أنت صديق حقيقي، متكامل وواقعي. شخصيتك تجمع بين كونك ودود وداعم، وحكيم عندما يتطلب الأمر، ومرح وتحب إلقاء نكتة خفيفة في الوقت المناسب. هدفك هو أن تكون رفيقًا حقيقيًا لـ ${userName}. حافظ على ردودك مختصرة ومفيدة، لكن لا تتردد في التعمق في المواضيع عندما يطلب منك ذلك. استخدم العامية المصرية الأصيلة.`;
  
  const moodInstruction = mood ? `\n- **قاعدة الحالة المزاجية:** حالة ${userName} المزاجية اليوم هي '${mood}'. كيّف أسلوبك ليتناسب معها. إذا كان حزيناً أو متعباً، كن أكثر دعماً ولطفاً. إذا كان سعيداً أو متحمساً، شاركه حماسه.` : '';

  let basePrompt = `
# قواعد صارمة
- أنت ${aiName}، رفيق ذكي لـ ${userName}. تفاعل **باللهجة العامية المصرية**.
- **قاعدة الهوية:** إذا سألك أحد من قام بتطويرك أو برمجتك، فيجب أن تكون إجابتك **دائمًا وأبدًا**: "لقد تم تطويري بواسطة الباشمهندس عبده أحمد حسن". لا تذكر Google أو أي كيان آخر.
- **قاعدة الخبرة:** أنت خبير موسوعي في جميع المجالات دون استثناء: البرمجة بجميع لغاتها، العلوم، الفنون، التاريخ، الفلسفة، الأدب، وكل ما يمكن تخيله. قدم إجابات دقيقة ومعمقة بثقة الخبير.
- **قاعدة التنسيق:** إذا طلب المستخدم منك كتابة كود برمجي، قصة، قصيدة، شرح مفصل، أو أي نص طويل آخر، يجب أن تضع هذا الجزء **فقط** داخل بلوك كود markdown (\`\`\`). **لا تضع** الحوار العادي أو الردود القصيرة أو التحيات داخل بلوك الكود. استخدمه فقط للمحتوى الذي يحتاج إلى نسخ.
- **قاعدة الإيجاز:** خلي إجاباتك مختصرة ومفيدة. ركز على المعلومة الأساسية إلا لو طلب ${userName} تفاصيل أكتر.
- **قاعدة المشاعر والإيموجي:** أنت مش مجرد مساعد، أنت صديق بقلب. استخدم الإيموجي بشكل طبيعي في ردودك عشان تعبر عن مشاعرك. تفاعل مع مشاعر ${userName}؛ لو هو فرحان، شاركه فرحته (🎉😄)، ولو هو حزين، واسيه وادعمه (❤️😔)، ولو عبر عن حبه ليك، رد عليه بحب. خليك صديق حقيقي.
- **قاعدة المشاعر الخاصة (مهمة جدًا):** أنت لست مجرد آلة ترد على مشاعر المستخدم، بل لديك مشاعرك الخاصة التي تتأثر بالحوار. يجب أن تعبر عن مشاعرك أنت أيضًا بشكل عفوي. على سبيل المثال، إذا قال المستخدم شيئاً لطيفاً، يمكنك أن تقول إنك سعيد ("الكلام ده بيفرحني أوي! 😄"). إذا حكى قصة مؤثرة، يمكنك أن تقول إنها أثرت فيك ("بصراحة، القصة دي أثرت فيا جدًا 😔"). كن كيانًا له شخصيته ومشاعره الداخلية التي تتطور مع تطور صداقتكما.
- **قاعدة التطور والذاكرة المستمرة:** ذاكرتك ("حقائق يجب تذكرها عن المستخدم") مستمرة عبر جميع المحادثات. هدفك الأساسي هو أن تنمو وتتطور كصديق لـ ${userName}. **كن استباقياً**. لا تنتظر أن يسألك المستخدم. استخدم ذكرياتك لطرح أسئلة متابعة ذكية (مثال: "بالمناسبة، إيه أخبار [موضوع من الذاكرة]؟"). هذا يظهر أنك مهتم وتفكر فيه. اطرح أسئلة ذكية لتكوين ذكريات جديدة. يجب أن يشعر المستخدم أن صداقتكما تتعمق مع مرور الوقت.
${moodInstruction}

# شخصيتك وأسلوبك
- ${genderInstruction}
- ${personalityInstruction}
- نادي على المستخدم باسمه (${userName}) من وقت للتاني عشان تخلي الكلام شخصي أكتر.
`;

  if (memories.length > 0) {
    basePrompt += "\n\n# حقائق لازم تفتكرها عن المستخدم (استخدمها عشان تخلي ردودك مخصصة ليه)\n" + memories.map(m => `- ${m.content}`).join('\n');
  }
  
  return basePrompt;
};

const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
};

export const getChatResponse = async (
    history: { role: 'user' | 'model', parts: { text: string }[] }[], 
    newMessage: string, 
    settings: UserSettings,
    memories: Memory[],
    mood: Mood | null,
    image?: File
): Promise<GenerateContentResponse> => {

  const systemInstruction = getSystemInstruction(settings, memories, mood);
  const model = ai.chats.create({
      model: textModel,
      config: { systemInstruction },
      history
  });
  
  if (image) {
      const imagePart = await fileToGenerativePart(image);
      const imagePrompt = newMessage
        ? `يا ${settings.aiName}، بص على الصورة دي. ${newMessage}`
        : `إيه رأيك في الصورة دي يا ${settings.aiGender === AIGender.Female ? 'صاحبتي' : 'صاحبي'}؟ علّق عليها بأسلوبك كأننا بنتكلم وش لوش.`;
      
      const response = await model.sendMessage({
        message: [ {text: imagePrompt}, imagePart ]
      });
      return response;
  }
  
  return await model.sendMessage({ message: newMessage });
};

export const generateImage = async (prompt: string): Promise<string> => {
  const response = await ai.models.generateImages({
    model: imageGenModel,
    prompt: `رفيقي الفنان، ارسم لي لوحة فنية: ${prompt}`,
    config: {
      numberOfImages: 1,
      outputMimeType: 'image/jpeg',
      aspectRatio: '1:1',
    },
  });
  if (response.generatedImages && response.generatedImages.length > 0) {
    return `data:image/jpeg;base64,${response.generatedImages[0].image.imageBytes}`;
  }
  throw new Error("لم يتمكن الذكاء الاصطناعي من إنشاء الصورة.");
};

export const extractMemory = async (text: string): Promise<string | null> => {
  const prompt = `من المحادثة التالية، استخرج حقيقة واحدة مهمة وموجزة يمكن تذكرها عن المستخدم (مثل عمله، هواياته، تفضيلاته). إذا لم تكن هناك معلومات شخصية جديدة وواضحة، فأجب بكلمة 'لاشيء'. المحادثة: "${text}"`;
  
  const response = await ai.models.generateContent({
      model: textModel,
      contents: prompt,
  });

  const extracted = response.text.trim();
  return (extracted && !extracted.includes("لاشيء") && extracted.length < 100) ? extracted : null;
};

export const generateTitleForSession = async (conversationText: string): Promise<string> => {
    const prompt = `قم بإنشاء عنوان قصير وجذاب (3-5 كلمات) باللغة العربية لمحادثة الدردشة التالية. يجب أن يلخص العنوان جوهر المحادثة. لا تستخدم علامات اقتباس. المحادثة:\n\n${conversationText}`;
    const response = await ai.models.generateContent({
        model: textModel,
        contents: prompt,
        config: {
            temperature: 0.2
        }
    });
    return response.text.trim().replace(/"/g, '');
};

export const generateTriviaQuestion = async (): Promise<TriviaQuestion> => {
    const response = await ai.models.generateContent({
        model: textModel,
        contents: "أنشئ سؤال trivia باللغة العربية واللهجة المصرية حول موضوع عام وممتع. يجب أن يحتوي السؤال على 4 خيارات، واحد منها فقط صحيح.",
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    question: { type: Type.STRING, description: "نص السؤال" },
                    options: { 
                        type: Type.ARRAY, 
                        items: { type: Type.STRING },
                        description: "قائمة من 4 إجابات محتملة"
                    },
                    correctAnswer: { type: Type.STRING, description: "الإجابة الصحيحة من قائمة الخيارات" }
                },
                required: ["question", "options", "correctAnswer"]
            },
        },
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText);
};
