import TelegramBot from "node-telegram-bot-api";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DynamoDB } from "aws-sdk";

import { randomUUID } from "crypto";

const dynamoDb = new DynamoDB.DocumentClient();
const params = {
  TableName: process.env.DYNAMODB_TABLE!,
};

// replace the value below with the Telegram token you receive from @BotFather
const token = "     ";

const bot = new TelegramBot(token);

let globalResolve: (value: any) => void = () => {};

export const webhook = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const bodyParsed = JSON.parse(event.body!);
  await new Promise((resolve, reject) => {
    globalResolve = resolve;
    bot.processUpdate(bodyParsed);
    // set timeout to 10 seconds to resolve
    setTimeout(() => {
      reject("global timeout");
    }, 10000);
  });

  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        message: "function executed successfully",
      },
      null,
      2
    ),
  };
};

bot.onText(
  /\/todos/,
  async (msg: TelegramBot.Message, match: RegExpExecArray | null) => {
    const chatId = msg.chat.id;
    // Find all todos for this chatId
    const r = await dynamoDb
      .query({
        ...params,
        KeyConditions: {
          chatId: {
            ComparisonOperator: "EQ",
            AttributeValueList: [chatId.toString()],
          },
        },
      })
      .promise();
    if (r.Items == undefined || r.Items!.length == 0) {
      await bot.sendMessage(chatId, `0️⃣ No TODOs found`);
      globalResolve("ok");
      return;
    }
    let message = "";
    for (const todo of r.Items!) {
      message += `➖ ${todo.what}\n`;
    }
    await bot.sendMessage(chatId, `📝 Current TODOs:\n${message}`);
    globalResolve("ok");
  }
);

bot.onText(
  /\/add (.+)/,
  async (msg: TelegramBot.Message, match: RegExpExecArray | null) => {
    const chatId = msg.chat.id;
    const what = match![1];
    const id = randomUUID();
    try {
      await dynamoDb
        .put({
          ...params,
          Item: {
            id,
            chatId,
            what,
          },
        })
        .promise();
      await bot.sendMessage(chatId, `✅ Added TODO: ${what}`);
    } catch (error) {
      console.error(error);
      await bot.sendMessage(chatId, `❌ Error adding TODO: ${what}`);
    }
    globalResolve("ok");
  }
);

bot.onText(
  /\/remove (.+)/,
  async (msg: TelegramBot.Message, match: RegExpExecArray | null) => {
    const chatId = msg.chat.id;
    const what = match![1];
    const r = await dynamoDb
      .query({
        ...params,
        KeyConditions: {
          chatId: {
            ComparisonOperator: "EQ",
            AttributeValueList: [chatId.toString()],
          },
          what: {
            ComparisonOperator: "EQ",
            AttributeValueList: [what],
          },
        },
      })
      .promise();
    if (r.Items == undefined || r.Items!.length == 0) {
      await bot.sendMessage(chatId, `❌ No TODO found`);
      globalResolve("ok");
      return;
    }
    await dynamoDb
      .delete({
        ...params,
        Key: {
          id: r.Items![0].id,
        },
      })
      .promise();
    await bot.sendMessage(chatId, `✅ Removed TODO: ${what}`);
    globalResolve("ok");
  }
);
