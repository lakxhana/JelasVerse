FROM node:20-alpine

RUN apk add --no-cache python3

WORKDIR /app
COPY . .

EXPOSE 4173 4174

# Default: serve the game (see docker-compose.yml for the phone-controller service).
CMD ["python3", "-m", "http.server", "4173"]
