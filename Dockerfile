FROM oven/bun

RUN mkdir /localip-pub
WORKDIR /localip-pub

ADD src src
ADD package.json package.json
ADD bun.lockb bun.lockb
RUN bun install

CMD bun run src/index.ts
