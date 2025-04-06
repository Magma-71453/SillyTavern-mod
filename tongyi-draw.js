// 文件名：tongyi-draw.js
const EXTENSION_NAME = "tongyi-draw";
import fetch from "node-fetch";

let settings = {
  apikey: "",
};

function initialize(contextOrSettings, eventEmitter) {
  console.log("通义图像扩展已加载喵～");

  // 判断是插件调用还是事件触发器调用喵～
  if (eventEmitter) {
    // 补丁模式：事件监听
    eventEmitter.on("message", async (msgData) => {
      const content = msgData.message?.trim();
      if (!content?.startsWith("/draw")) return;

      const prompt = content.replace("/draw", "").trim();
      const apikey = process.env.DASHSCOPE_API_KEY || settings.apikey;

      const response = await fetch("https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apikey}`,
          "Content-Type": "application/json",
          "X-DashScope-Async": "enable",
        },
        body: JSON.stringify({
          model: "wanx2.1-t2i-turbo",
          input: { prompt },
          parameters: {
            size: "1024*1024",
            n: 1,
          },
        }),
      });

      const data = await response.json();
      const taskId = data.request_id;

      if (!taskId) {
        sendChatMessage("图片生成失败了喵～API 没返回任务 ID 喵");
        return;
      }

      sendChatMessage(`收到请求喵，任务 ID：${taskId}，稍等我去拿图图～`);

      setTimeout(async () => {
        const res2 = await fetch(`https://dashscope.aliyuncs.com/api/v1/tasks/${taskId}`, {
          headers: {
            "Authorization": `Bearer ${apikey}`,
          },
        });
        const resultData = await res2.json();

        const url = resultData?.output?.results?.[0]?.url;
        if (url) {
          sendChatMessage(`喵～图画好了喵！${url}`);
        } else {
          sendChatMessage(`还没画好呢喵或出错了，稍后再试试看喵～`);
        }
      }, 5000); // 5秒等待
    });
  } else {
    // 原插件模式：slash command 注册
    settings = contextOrSettings.settings;

    contextOrSettings.registerSlashCommand({
      name: "draw",
      description: "用通义千问生成图像喵～",
      parameters: [
        {
          name: "prompt",
          type: "string",
          description: "你想画什么图？",
          required: true,
        },
      ],
      handler: async (args) => {
        const prompt = args.prompt;
        contextOrSettings.addMessage(`好喵！正在画：${prompt} ～`);

        const imageUrl = await generateImage(prompt);
        if (imageUrl) {
          contextOrSettings.addMessage(`图来啦喵～\n![通义图](${imageUrl})`);
        } else {
          contextOrSettings.addMessage(`呜呜呜～图生不出来耶，API 有点问题喵～`);
        }
      },
    });
  }
}

// 原模式下同步生成接口，仍然保留喵～
async function generateImage(prompt) {
  try {
    const res = await fetch("https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${settings.apikey}`,
      },
      body: JSON.stringify({
        model: "wanx-v1",
        input: {
          prompt,
        },
      }),
    });

    const json = await res.json();
    console.log("[TongyiDraw] response:", json);
    return json?.output?.results?.[0]?.url ?? null;
  } catch (err) {
    console.error("[TongyiDraw] error:", err);
    return null;
  }
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

// 你自己定义的消息发送函数应该由实际 bot 框架提供喵～
function sendChatMessage(msg) {
  console.log("[模拟消息] =>", msg); // 可替换为真实消息发送函数喵～
}

export default {
  name: EXTENSION_NAME,
  initialize,
  getSettings,
};
