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
  console.log("bodyParsed", bodyParsed);
  await new Promise((resolve, reject) => {
    globalResolve = resolve;
    bot.processUpdate(bodyParsed);
    // set timeout to 3 seconds to resolve the promise in case the bot doesn't respond
    setTimeout(() => {
      // make sure to resolve the promise in case of timeout as well
      // do not reject the promise, otherwise the lambda will be marked as failed
      resolve("global timeout");
    }, 3000);
  });

  // respond to Telegram that the webhook has been received.
  // if this is not sent, telegram will try to resend the webhook over and over again.
  return {
    statusCode: 200,
    body: JSON.stringify({ message: "function executed successfully" }),
  };
};

bot.onText(
  /\/todos/,
  async (msg: TelegramBot.Message, match: RegExpExecArray | null) => {
    const chatId = msg.chat.id;
    try {
      // Find all todos for this chatId
      const r = await dynamoDb
        .query({
          ...params,
          KeyConditionExpression: "chatId = :chatId",
          ExpressionAttributeValues: {
            ":chatId": chatId.toString(),
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
    } catch (error) {
      console.error(error);
      await bot.sendMessage(chatId, `❌ Error getting TODOs: ${error}`);
    }
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
            chatId: chatId.toString(),
            what,
          },
        })
        .promise();
      await bot.sendMessage(chatId, `✅ Added TODO: ${what}`);
    } catch (error) {
      console.error(error);
      await bot.sendMessage(chatId, `❌ Error adding TODO: ${what} (${error})`);
    }
    globalResolve("ok");
  }
);

bot.onText(
  /\/remove (.+)/,
  async (msg: TelegramBot.Message, match: RegExpExecArray | null) => {
    const chatId = msg.chat.id;
    const what = match![1];
    try {
      const r = await dynamoDb
        .query({
          ...params,
          KeyConditionExpression: "chatId = :chatId",
          FilterExpression: "what = :what",
          ExpressionAttributeValues: {
            ":chatId": chatId.toString(),
            ":what": what,
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
            chatId: chatId.toString(),
          },
        })
        .promise();
      await bot.sendMessage(chatId, `✅ Removed TODO: ${what}`);
    } catch (error) {
      console.error(error);
      await bot.sendMessage(
        chatId,
        `❌ Error removing TODO: ${what} (${error})`
      );
    }
    globalResolve("ok");
  }
);
