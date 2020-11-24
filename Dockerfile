FROM amd64/node:current-alpine

RUN apk add --no-cache tzdata ; \
    cp /usr/share/zoneinfo/America/Costa_Rica /etc/localtime ; \
    echo "America/Costa_Rica" | tee -a /etc/timezone

COPY src /bot
WORKDIR /bot
RUN npm install 2>/dev/null

ENTRYPOINT ["npm","start"]
