# Telegram Typescript Serverless Bot Tutorial
<div align="center">

[![GitHub](https://img.shields.io/github/license/royshil/telegram-serverless-ts-bot-tutorial)](https://img.shields.io/github/license/royshil/telegram-serverless-ts-bot-tutorial)

[**Blogpost**](https://www.morethantechnical.com/2023/05/18/aws-lambda-nodejs-telegram-bot-with-typescript-serverless-and-dynamodb/)
| [**YouTube**](http://www.youtube.com/watch?v=MtWUKFcljKg)

</div>

In this tutorial, we will explore how to build a simple Telegram bot using serverless with TypeScript and AWS Lambda. We’ll leverage the power of AWS services such as API Gateway and DynamoDB to create a highly scalable and efficient bot. While there are various tutorials available online, this guide aims to provide a more comprehensive and detailed approach.

Run npm
```sh
$ npm i
```

Deploy the bot CF stack:
```sh
$ ./node_modules/.bin/serverless deploy
```

CURL command for setting the webhook for the bot: (URL given by the `serverless deploy` output)
```sh
$ curl --request POST --url "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook" --header 'content-type: application/json' --data '{"url": "<URL>"}'
```

## Code Walkthrough Video
[![Code Walkthrough on YouTube](http://img.youtube.com/vi/MtWUKFcljKg/0.jpg)](http://www.youtube.com/watch?v=MtWUKFcljKg)
