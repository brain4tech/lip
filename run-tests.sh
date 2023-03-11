export LIP_HOSTNAME=127.0.0.1
export LIP_PORT=5000
export LIP_DB_NAME=lip-test.sqlite
export LIP_TO_STDOUT=false

bun test
rm $LIP_DB_NAME
