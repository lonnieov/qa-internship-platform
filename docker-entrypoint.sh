#!/bin/sh
set -e

npx prisma db push --skip-generate
npx prisma db seed

exec "$@"
