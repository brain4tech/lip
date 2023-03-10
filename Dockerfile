FROM oven/bun

RUN mkdir /lip
WORKDIR /lip

ADD src src
ADD test test
ADD package.json package.json
ADD run-tests.sh run-tests.sh
RUN bun install

CMD bun run src/index.ts
