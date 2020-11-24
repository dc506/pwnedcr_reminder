# pwnedcr_reminder
Discord reminder bot for PwnedCR

## Secrets

Create file `src/secrets.json` and fill the information needed from this template:

```json
{
    BOT_TOKEN: "DISCORD_BOT_TOKEN"
}
```

## Plug & Play

Build the image:
```bash
docker build -t $(basename $PWD) . --no-cache
```

And run a new instance of the bot:
```bash
docker run --rm -ti --name bot pwnedcr_reminder:latest
```
