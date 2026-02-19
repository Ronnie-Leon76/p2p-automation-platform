$ErrorActionPreference = "Stop"

$containerName = "p2p-postgres-dev"
$image = "postgres:16"
$port = "5432"
$db = "p2p_automation"
$user = "p2p"
$password = "p2p_dev_password"

$existing = docker ps -a --filter "name=^/${containerName}$" --format "{{.Names}}"

if ($existing -eq $containerName) {
  Write-Host "Starting existing container: $containerName"
  docker start $containerName | Out-Null
} else {
  Write-Host "Creating container: $containerName"
  docker run -d `
    --name $containerName `
    -e POSTGRES_DB=$db `
    -e POSTGRES_USER=$user `
    -e POSTGRES_PASSWORD=$password `
    -p ${port}:5432 `
    $image | Out-Null
}

Write-Host "Postgres is available on localhost:$port"
Write-Host "DATABASE_URL=postgresql://${user}:${password}@localhost:${port}/${db}?schema=public"
