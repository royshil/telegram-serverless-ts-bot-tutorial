# telegram-serverless-ts-bot-tutorial
Telegram Typescript Serverless Bot Tutorial

Deploy the bot CF stack:
```sh
$ ./node_modules/.bin/serverless deploy
```

CURL command for setting the webhook for the bot:
```sh
curl --request POST --url "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook" --header 'content-type: application/json' --data '{"url": "<URL>"}'
```
