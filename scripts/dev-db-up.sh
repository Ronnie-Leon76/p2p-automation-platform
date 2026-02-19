#!/usr/bin/env bash
set -euo pipefail

container_name="p2p-postgres-dev"
image="postgres:16"
port="5432"
db="p2p_automation"
user="p2p"
password="p2p_dev_password"

if docker ps -a --format '{{.Names}}' | grep -q "^${container_name}$"; then
  echo "Starting existing container: ${container_name}"
  docker start "${container_name}" >/dev/null
else
  echo "Creating container: ${container_name}"
  docker run -d \
    --name "${container_name}" \
    -e POSTGRES_DB="${db}" \
    -e POSTGRES_USER="${user}" \
    -e POSTGRES_PASSWORD="${password}" \
    -p "${port}:5432" \
    "${image}" >/dev/null
fi

echo "Postgres is available on localhost:${port}"
echo "DATABASE_URL=postgresql://${user}:${password}@localhost:${port}/${db}?schema=public"
