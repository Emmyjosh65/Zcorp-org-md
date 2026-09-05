import 'dotenv/config';
import TelegramBot from 'node-telegram-bot-api';
import { GoogleGenAI } from '@google/genai';

const BOT_TOKEN = process.env.BOT_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!BOT_TOKEN) {
  console.error('❌ BOT_TOKEN is missing from .env');
  process.exit(1);
}

if (!GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY is missing from .env');
  process.exit(1);
}

const bot = new TelegramBot(BOT_TOKEN, {
  polling: true
});

const ai = new GoogleGenAI({
  apiKey: GEMINI_API_KEY
});

const CONFIG = {
  website:
    process.env.ZCORP_WEBSITE ||
    'https://zcorp-org-co.vercel.app/',

  registration:
    process.env.ZCORP_REGISTRATION ||
    'https://zeus-corp-registration.vercel.app/',

  channel:
    process.env.ZCORP_CHANNEL ||
    'https://t.me/zcorporg',

  community:
    process.env.ZCORP_COMMUNITY ||
    'https://t.me/+M8TTeOV7ElpjMDk0',

  whatsapp:
    process.env.CEO_WHATSAPP ||
    '2349066760078',

  email:
    process.env.PA_EMAIL ||
    'ge5853987@gmail.com',

  model:
    process.env.GEMINI_MODEL ||
    'gemini-2.5-flash'
};


/*
====================================================
USER MEMORY
====================================================
*/

const users = new Map();

function getUser(chatId) {

  if (!users.has(chatId)) {

    users.set(chatId, {
      mode: 'general',
      history: []
    });

  }

  return users.get(chatId);
}


/*
====================================================
MAIN MENU
====================================================
*/

function mainKeyboard() {

  return {

    inline_keyboard: [

      [
        {
          text: '🤖 ZCORP AI',
          callback_data: 'ai_menu'
        },
        {
          text: '🛠 ZCORP TOOLS',
          callback_data: 'tools_menu'
        }
      ],

      [
        {
          text: '🏢 About ZCORP',
          callback_data: 'about'
        },
        {
          text: '💻 Services',
          callback_data: 'services'
        }
      ],

      [
        {
          text: '🚀 Projects',
          callback_data: 'projects'
        },
        {
          text: '📰 News',
          callback_data: 'news'
        }
      ],

      [
        {
          text: '📝 Join ZCORP',
          callback_data: 'join'
        },
        {
          text: '☎️ Customer Care',
          callback_data: 'support'
        }
      ],

      [
        {
          text: '🌐 Website',
          url: CONFIG.website
        },
        {
          text: '📢 Channel',
          url: CONFIG.channel
        }
      ],

      [
        {
          text: '👥 Community',
          url: CONFIG.community
        }
      ]

    ]

  };

}


/*
====================================================
JOIN MENU
====================================================
*/

function joinKeyboard() {

  return {

    inline_keyboard: [

      [
        {
          text: '📢 JOIN CHANNEL',
          url: CONFIG.channel
        },

        {
          text: '👥 JOIN COMMUNITY',
          url: CONFIG.community
        }
      ],

      [
        {
          text: "✅ I'VE JOINED — CONTINUE",
          callback_data: 'continue_menu'
        }
      ]

    ]

  };

}


/*
====================================================
AI MENU
====================================================
*/

function aiKeyboard() {

  return {

    inline_keyboard: [

      [
        {
          text: '💬 General',
          callback_data: 'mode_general'
        },

        {
          text: '💻 Coding',
          callback_data: 'mode_coding'
        }
      ],

      [
        {
          text: '🌐 Website',
          callback_data: 'mode_website'
        },

        {
          text: '✍️ Writing',
          callback_data: 'mode_writing'
        }
      ],

      [
        {
          text: '🐞 Debug',
          callback_data: 'mode_debug'
        },

        {
          text: '🎨 Design',
          callback_data: 'mode_design'
        }
      ],

      [
        {
          text: '🧹 Clear Chat',
          callback_data: 'ai_clear'
        },

        {
          text: '⬅️ Main Menu',
          callback_data: 'main_menu'
        }
      ]

    ]

  };

}


/*
====================================================
TOOLS MENU
====================================================
*/

function toolsKeyboard() {

  return {

    inline_keyboard: [

      [
        {
          text: '🧮 Calculator',
          callback_data: 'tool_calculator'
        },

        {
          text: '🔐 Password',
          callback_data: 'tool_password'
        }
      ],

      [
        {
          text: '🎲 Random Number',
          callback_data: 'tool_random'
        },

        {
          text: '🔠 Uppercase',
          callback_data: 'tool_upper'
        }
      ],

      [
        {
          text: '🔡 Lowercase',
          callback_data: 'tool_lower'
        }
      ],

      [
        {
          text: '⬅️ Main Menu',
          callback_data: 'main_menu'
        }
      ]

    ]

  };

}


/*
====================================================
AI MODE NAME
====================================================
*/

function modeName(mode) {

  const modes = {

    general: 'General',
    coding: 'Coding',
    website: 'Website',
    writing: 'Writing',
    debug: 'Debug',
    design: 'Design'

  };

  return modes[mode] || 'General';

}


/*
====================================================
ZCORP AI SYSTEM PROMPT
====================================================
*/

function systemPrompt(mode) {

  return `

You are ZCORP AI.

You are the official intelligent assistant for ZCORP ORG.

ZCORP ORG slogan:

BUILD. CREATE. SELL. INNOVATE.

ZCORP is a creative web development organization.

ZCORP works on:

- Websites
- Web applications
- Dashboards
- UI/UX
- Gaming platforms
- Community platforms
- Digital tools
- Custom software
- Ready-made projects
- Website customization

CEO:

Zeus (Godwin Emmanuel)

ZCORP WEBSITE:

${CONFIG.website}

REGISTRATION:

${CONFIG.registration}

TELEGRAM CHANNEL:

${CONFIG.channel}

TELEGRAM COMMUNITY:

${CONFIG.community}

CURRENT AI MODE:

${modeName(mode)}

RULES:

1. Be helpful.
2. Give practical answers.
3. Keep answers reasonably concise.
4. For coding, provide working code.
5. For debugging, identify the likely problem first.
6. For website development, suggest modern responsive solutions.
7. Never expose API keys.
8. Never expose bot tokens.
9. Never expose passwords.
10. Never invent private ZCORP information.
11. Never claim you performed an action outside the bot.

`;

}


/*
====================================================
ASK GEMINI
====================================================
*/

async function askGemini(chatId, message) {

  const user = getUser(chatId);

  user.history.push({
    role: 'user',
    text: message
  });

  const recentHistory =
    user.history.slice(-12);

  const conversation =
    recentHistory
      .map(item => {

        if (item.role === 'user') {
          return `User: ${item.text}`;
        }

        return `ZCORP AI: ${item.text}`;

      })
      .join('\n');

  try {

    const response =
      await ai.models.generateContent({

        model: CONFIG.model,

        contents: `

${systemPrompt(user.mode)}

CONVERSATION:

${conversation}

Answer the latest user message.

`

      });

    const answer =
      (response.text || '').trim();

    const finalAnswer =
      answer ||
      '⚠️ I could not generate a response right now.';

    user.history.push({

      role: 'assistant',

      text: finalAnswer

    });

    return finalAnswer;

  } catch (error) {

    console.error(
      'Gemini error:',
      error
    );

    return `
⚠️ ZCORP AI is temporarily unavailable.

Please check:

• GEMINI_API_KEY
• Gemini model
• Internet connection
• Pterodactyl server status
`;

  }

}


/*
====================================================
PASSWORD GENERATOR
====================================================
*/

function generatePassword(length = 18) {

  const characters =
    'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';

  let result = '';

  for (
    let i = 0;
    i < length;
    i++
  ) {

    result +=
      characters[
        Math.floor(
          Math.random() *
          characters.length
        )
      ];

  }

  return result;

}


/*
====================================================
CALCULATOR
====================================================
*/

function calculate(expression) {

  if (
    !/^[0-9+\-*/().%\s]+$/.test(
      expression
    )
  ) {

    throw new Error(
      'Invalid expression'
    );

  }

  const result =
    Function(
      `"use strict"; return (${expression})`
    )();

  if (
    !Number.isFinite(result)
  ) {

    throw new Error(
      'Invalid result'
    );

  }

  return result;

}


/*
====================================================
MAIN MENU FUNCTION
====================================================
*/

async function sendMainMenu(chatId) {

  await bot.sendMessage(

    chatId,

    `🏢 *WELCOME TO ZCORP ORG*

*BUILD. CREATE. SELL. INNOVATE.*

Your gateway to ZCORP services, projects, AI and tools.

Choose an option below:`,

    {
      parse_mode: 'Markdown',
      reply_markup: mainKeyboard()
    }

  );

}


/*
====================================================
START
====================================================
*/

bot.onText(
  /^\/start(?:\s+.*)?$/i,
  async msg => {

    const chatId =
      msg.chat.id;

    getUser(chatId);

    await bot.sendMessage(

      chatId,

      `🚀 *WELCOME TO ZCORP ORG*

Join the official ZCORP channel and community.

Then press:

*I'VE JOINED — CONTINUE*

⚠️ The continue button does not verify membership.`,

      {
        parse_mode: 'Markdown',
        reply_markup: joinKeyboard()
      }

    );

  }
);


/*
====================================================
HELP
====================================================
*/

bot.onText(
  /^\/help$/i,
  async msg => {

    await bot.sendMessage(

      msg.chat.id,

      `🆘 *ZCORP BOT HELP*

/start — Open ZCORP
/ai — Open ZCORP AI
/tools — Open ZCORP Tools
/website — Open website
/register — Registration
/help — Help

You can also use the buttons in the menu.`,

      {
        parse_mode: 'Markdown',
        reply_markup: mainKeyboard()
      }

    );

  }
);


/*
====================================================
AI COMMAND
====================================================
*/

bot.onText(
  /^\/ai$/i,
  async msg => {

    const current =
      getUser(msg.chat.id);

    await bot.sendMessage(

      msg.chat.id,

      `🤖 *ZCORP AI*

Current mode:

*${modeName(current.mode)}*

Choose an AI mode below:`,

      {
        parse_mode: 'Markdown',
        reply_markup: aiKeyboard()
      }

    );

  }
);


/*
====================================================
TOOLS COMMAND
====================================================
*/

bot.onText(
  /^\/tools$/i,
  async msg => {

    await bot.sendMessage(

      msg.chat.id,

      `🛠 *ZCORP TOOLS*

Choose a tool:`,

      {
        parse_mode: 'Markdown',
        reply_markup: toolsKeyboard()
      }

    );

  }
);


/*
====================================================
WEBSITE COMMAND
====================================================
*/

bot.onText(
  /^\/website$/i,
  async msg => {

    await bot.sendMessage(

      msg.chat.id,

      `🌐 ZCORP Website

${CONFIG.website}`

    );

  }
);


/*
====================================================
REGISTER COMMAND
====================================================
*/

bot.onText(
  /^\/register$/i,
  async msg => {

    await bot.sendMessage(

      msg.chat.id,

      `📝 *ZCORP REGISTRATION*

Click below to open the official registration portal.`,

      {
        parse_mode: 'Markdown',

        reply_markup: {

          inline_keyboard: [

            [
              {
                text: '📝 REGISTER NOW',
                url: CONFIG.registration
              }
            ],

            [
              {
                text: '⬅️ Main Menu',
                callback_data: 'main_menu'
              }
            ]

          ]

        }

      }

    );

  }
);


/*
====================================================
CALLBACK BUTTONS
====================================================
*/

bot.on(
  'callback_query',
  async query => {

    const chatId =
      query.message.chat.id;

    const data =
      query.data;

    try {

      await bot.answerCallbackQuery(
        query.id
      );

      /*
      MAIN MENU
      */

      if (
        data === 'continue_menu' ||
        data === 'main_menu'
      ) {

        await sendMainMenu(chatId);

        return;

      }


      /*
      AI MENU
      */

      if (
        data === 'ai_menu'
      ) {

        const current =
          getUser(chatId);

        await bot.sendMessage(

          chatId,

          `🤖 *ZCORP AI*

Current mode:

*${modeName(current.mode)}*

Choose a mode:`,

          {
            parse_mode: 'Markdown',
            reply_markup: aiKeyboard()
          }

        );

        return;

      }


      /*
      AI MODES
      */

      if (
        data.startsWith(
          'mode_'
        )
      ) {

        const mode =
          data.replace(
            'mode_',
            ''
          );

        getUser(chatId).mode =
          mode;

        await bot.sendMessage(

          chatId,

          `✅ AI mode changed to:

*${modeName(mode)}*

Send your question now.`,

          {
            parse_mode: 'Markdown',
            reply_markup: aiKeyboard()
          }

        );

        return;

      }


      /*
      CLEAR AI
      */

      if (
        data === 'ai_clear'
      ) {

        getUser(chatId).history =
          [];

        await bot.sendMessage(

          chatId,

          '🧹 ZCORP AI conversation cleared.'

        );

        return;

      }


      /*
      TOOLS
      */

      if (
        data === 'tools_menu'
      ) {

        await bot.sendMessage(

          chatId,

          `🛠 *ZCORP TOOLS*

Choose a tool:`,

          {
            parse_mode: 'Markdown',
            reply_markup: toolsKeyboard()
          }

        );

        return;

      }


      /*
      PASSWORD
      */

      if (
        data === 'tool_password'
      ) {

        await bot.sendMessage(

          chatId,

          `🔐 *GENERATED PASSWORD*

\`${generatePassword()}\``,

          {
            parse_mode: 'Markdown',

            reply_markup: {

              inline_keyboard: [

                [
                  {
                    text: '🔄 Generate Again',
                    callback_data:
                      'tool_password'
                  }
                ],

                [
                  {
                    text: '⬅️ Tools',
                    callback_data:
                      'tools_menu'
                  }
                ]

              ]

            }

          }

        );

        return;

      }


      /*
      RANDOM
      */

      if (
        data === 'tool_random'
      ) {

        const number =
          Math.floor(
            Math.random() * 100
          ) + 1;

        await bot.sendMessage(

          chatId,

          `🎲 Random number:

*${number}*`,

          {
            parse_mode: 'Markdown',
            reply_markup:
              toolsKeyboard()
          }

        );

        return;

      }


      /*
      CALCULATOR
      */

      if (
        data === 'tool_calculator'
      ) {

        getUser(chatId).mode =
          'calculator';

        await bot.sendMessage(

          chatId,

          `🧮 *CALCULATOR*

Send an expression.

Example:

\`25*4+10\``,

          {
            parse_mode: 'Markdown'
          }

        );

        return;

      }


      /*
      UPPERCASE
      */

      if (
        data === 'tool_upper'
      ) {

        getUser(chatId).mode =
          'upper';

        await bot.sendMessage(

          chatId,

          '🔠 Send the text you want converted to UPPERCASE.'

        );

        return;

      }


      /*
      LOWERCASE
      */

      if (
        data === 'tool_lower'
      ) {

        getUser(chatId).mode =
          'lower';

        await bot.sendMessage(

          chatId,

          '🔡 Send the text you want converted to lowercase.'

        );

        return;

      }


      /*
      ABOUT
      */

      if (
        data === 'about'
      ) {

        await bot.sendMessage(

          chatId,

          `🏢 *ABOUT ZCORP ORG*

ZCORP is a creative web development organization focused on modern, powerful and professional digital experiences.

*CEO:* Zeus (Godwin Emmanuel)

*MISSION*

Build useful digital products including:

• Websites
• Web apps
• Dashboards
• Community platforms
• Digital tools
• Custom projects

*BUILD. CREATE. SELL. INNOVATE.*`,

          {
            parse_mode: 'Markdown',
            reply_markup:
              mainKeyboard()
          }

        );

        return;

      }


      /*
      SERVICES
      */

      if (
        data === 'services'
      ) {

        await bot.sendMessage(

          chatId,

          `💻 *ZCORP SERVICES*

• Website development
• Web applications
• Dashboards
• UI/UX design
• Gaming platforms
• Community platforms
• Digital tools
• Custom projects
• Ready-made projects
• Project customization`,

          {
            parse_mode: 'Markdown',

            reply_markup: {

              inline_keyboard: [

                [
                  {
                    text: '☎️ Customer Care',
                    callback_data:
                      'support'
                  }
                ],

                [
                  {
                    text: '⬅️ Main Menu',
                    callback_data:
                      'main_menu'
                  }
                ]

              ]

            }

          }

        );

        return;

      }


      /*
      PROJECTS
      */

      if (
        data === 'projects'
      ) {

        await bot.sendMessage(

          chatId,

          `🚀 *ZCORP PROJECTS*

ZCORP is continuously building and updating digital projects.

Visit the official website for current projects and updates.`,

          {
            parse_mode: 'Markdown',

            reply_markup: {

              inline_keyboard: [

                [
                  {
                    text: '🌐 View Website',
                    url: CONFIG.website
                  }
                ],

                [
                  {
                    text: '⬅️ Main Menu',
                    callback_data:
                      'main_menu'
                  }
                ]

              ]

            }

          }

        );

        return;

      }


      /*
      NEWS
      */

      if (
        data === 'news'
      ) {

        await bot.sendMessage(

          chatId,

          `📰 *ZCORP NEWS*

Follow the official ZCORP Telegram channel for:

• Announcements
• Project updates
• New releases
• Important notices`,

          {
            parse_mode: 'Markdown',

            reply_markup: {

              inline_keyboard: [

                [
                  {
                    text: '📢 OPEN CHANNEL',
                    url: CONFIG.channel
                  }
                ],

                [
                  {
                    text: '⬅️ Main Menu',
                    callback_data:
                      'main_menu'
                  }
                ]

              ]

            }

          }

        );

        return;

      }


      /*
      JOIN
      */

      if (
        data === 'join'
      ) {

        await bot.sendMessage(

          chatId,

          `📝 *JOIN ZCORP*

Register through the official ZCORP registration portal.`,

          {
            parse_mode: 'Markdown',

            reply_markup: {

              inline_keyboard: [

                [
                  {
                    text: '📝 REGISTER NOW',
                    url:
                      CONFIG.registration
                  }
                ],

                [
                  {
                    text: '⬅️ Main Menu',
                    callback_data:
                      'main_menu'
                  }
                ]

              ]

            }

          }

        );

        return;

      }


      /*
      CUSTOMER CARE
      */

      if (
        data === 'support'
      ) {

        await bot.sendMessage(

          chatId,

          `☎️ *ZCORP CUSTOMER CARE*

WhatsApp:

https://wa.me/${CONFIG.whatsapp}

Email:

${CONFIG.email}

For project requests, complaints or assistance, contact ZCORP customer care.`,

          {
            parse_mode: 'Markdown',

            reply_markup: {

              inline_keyboard: [

                [
                  {
                    text: '💬 WhatsApp',
                    url:
                      `https://wa.me/${CONFIG.whatsapp}`
                  }
                ],

                [
                  {
                    text: '⬅️ Main Menu',
                    callback_data:
                      'main_menu'
                  }
                ]

              ]

            }

          }

        );

        return;

      }

    } catch (error) {

      console.error(
        'Callback error:',
        error
      );

    }

  }
);


/*
====================================================
NORMAL TEXT MESSAGES
====================================================
*/

bot.on(
  'message',
  async msg => {

    if (
      !msg.text
    ) return;

    if (
      msg.text.startsWith('/')
    ) return;

    const chatId =
      msg.chat.id;

    const text =
      msg.text.trim();

    if (!text) return;

    const current =
      getUser(chatId);


    /*
    CALCULATOR
    */

    if (
      current.mode ===
      'calculator'
    ) {

      try {

        const result =
          calculate(text);

        current.mode =
          'general';

        await bot.sendMessage(

          chatId,

          `🧮 Result:

*${result}*`,

          {
            parse_mode: 'Markdown',
            reply_markup:
              toolsKeyboard()
          }

        );

      } catch {

        await bot.sendMessage(

          chatId,

          `⚠️ Invalid calculation.

Example:

\`25*4+10\``,

          {
            parse_mode: 'Markdown'
          }

        );

      }

      return;

    }


    /*
    UPPERCASE
    */

    if (
      current.mode ===
      'upper'
    ) {

      current.mode =
        'general';

      await bot.sendMessage(

        chatId,

        text.toUpperCase(),

        {
          reply_markup:
            toolsKeyboard()
        }

      );

      return;

    }


    /*
    LOWERCASE
    */

    if (
      current.mode ===
      'lower'
    ) {

      current.mode =
        'general';

      await bot.sendMessage(

        chatId,

        text.toLowerCase(),

        {
          reply_markup:
            toolsKeyboard()
        }

      );

      return;

    }


    /*
    ZCORP AI
    */

    await bot.sendChatAction(
      chatId,
      'typing'
    );

    const answer =
      await askGemini(
        chatId,
        text
      );


    /*
    TELEGRAM MESSAGE LIMIT
    */

    const chunks =
      answer.match(
        /[\s\S]{1,3800}/g
      ) || [answer];


    for (
      const chunk of chunks
    ) {

      await bot.sendMessage(

        chatId,

        chunk,

        {
          reply_markup: {

            inline_keyboard: [

              [
                {
                  text: '🤖 AI Menu',
                  callback_data:
                    'ai_menu'
                },

                {
                  text: '🏠 Main Menu',
                  callback_data:
                    'main_menu'
                }
              ]

            ]

          }

        }

      );

    }

  }
);


/*
====================================================
ERROR HANDLERS
====================================================
*/

bot.on(
  'polling_error',
  error => {

    console.error(
      'Telegram polling error:',
      error.message
    );

  }
);

process.on(
  'unhandledRejection',
  error => {

    console.error(
      'Unhandled rejection:',
      error
    );

  }
);

process.on(
  'uncaughtException',
  error => {

    console.error(
      'Uncaught exception:',
      error
    );

  }
);


/*
====================================================
START
====================================================
*/

console.log(
  '🚀 ZCORP Telegram Bot is starting...'
);

console.log(
  `🌐 Website: ${CONFIG.website}`
);

console.log(
  `🤖 Gemini model: ${CONFIG.model}`
);
