// filename: extensions/tongyi-draw.js
const EXTENSION_NAME = "tongyi-draw";

let settings = {
  apikey: "",
};

function initialize(extensionSettings, eventEmitter) {
  settings = extensionSettings;

  eventEmitter.on("message", async (msgData) => {
    const content = msgData.message?.trim();
    if (!content?.startsWith("/draw")) return;

    const prompt = content.replace("/draw", "").trim();
    if (!prompt) return;

    sendChatMessage(`好哦喵～正在用通义千问生成图：${prompt} 喵～`);

    const imageUrl = await generateImage(prompt);
    if (imageUrl) {
      sendChatMessage(`图来啦喵～\n![通义图](${imageUrl})`);
    } else {
      sendChatMessage(`呜呜喵～图生不出来耶，检查 API Key 吧喵～`);
    }
  });
}

async function generateImage(prompt) {
  const res = await fetch("https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${settings.apikey}`,
    },
    body: JSON.stringify({
      model: "wanx-v1", // 也可能是 "wanx-v1-creative"，要看你控制台配置喵～
      input: {
        prompt: prompt,
      },
    }),
  });

  if (!res.ok) return null;
  const json = await res.json();
  return json?.output?.results?.[0]?.url ?? null;
}

function getSettings() {
  return [
    {
      id: "apikey",
      type: "text",
      label: "DashScope API Key",
      default: "",
    },
  ];
}

export default {
  name: EXTENSION_NAME,
  initialize,
  getSettings,
};