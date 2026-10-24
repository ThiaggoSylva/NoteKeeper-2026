# Configura os User Secrets necessários para rodar a API em desenvolvimento.
# Nenhum desses valores deve ir para o appsettings.json nem para o
# appsettings.Development.json: eles ficam fora do repositório, em
# %APPDATA%\Microsoft\UserSecrets\NoteKeeper\secrets.json.
#
# Uso (de qualquer pasta):
#   .\server\scripts\setup-user-secrets.ps1
#
# Variáveis de ambiente opcionais:
#   NOTEKEEPER_SQL_CONNECTION   connection string do SQL Server (padrão: o do docker-compose.yml)
#   LUCKYPENNY_LICENSE_KEY      chave de licença do Lucky Penny (MediatR)

$ErrorActionPreference = "Stop"
$projeto = Join-Path $PSScriptRoot "..\src\Api\NoteKeeper.Api.csproj" | Resolve-Path

function Definir-Segredo([string]$chave, [string]$valor) {
  dotnet user-secrets set $chave $valor --project $projeto | Out-Null
  if ($LASTEXITCODE -ne 0) { throw "Falha ao definir $chave" }
  Write-Host "  ok  $chave"
}

function Existe-Segredo([string]$chave) {
  $lista = dotnet user-secrets list --project $projeto 2>$null
  return [bool]($lista | Where-Object { $_ -like "$chave =*" })
}

Write-Host "Configurando User Secrets de $projeto..."

# 1. Connection string (padrão = SQL Server do docker-compose.yml deste repositório)
$conexao = $env:NOTEKEEPER_SQL_CONNECTION
if ([string]::IsNullOrWhiteSpace($conexao)) {
  $conexao = 'Server=localhost,1433;Database=NoteKeeperDb;User Id=sa;Password=Academia@2026!;TrustServerCertificate=True'
}
Definir-Segredo "ConnectionStrings:SqlServer" $conexao

# 2. Chave de assinatura do JWT (mínimo 32 bytes). Gerada uma vez; não é sobrescrita.
if (Existe-Segredo "Jwt:SigningKey") {
  Write-Host "  --  Jwt:SigningKey já existe, mantida"
} else {
  $bytes = New-Object byte[] 48
  [System.Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
  Definir-Segredo "Jwt:SigningKey" ([Convert]::ToBase64String($bytes))
}

# 3. Licença do Lucky Penny (MediatR): é uma chave sua, então não é gerada aqui.
if (-not [string]::IsNullOrWhiteSpace($env:LUCKYPENNY_LICENSE_KEY)) {
  Definir-Segredo "LuckyPenny:LicenseKey" $env:LUCKYPENNY_LICENSE_KEY
} elseif (Existe-Segredo "LuckyPenny:LicenseKey") {
  Write-Host "  --  LuckyPenny:LicenseKey já existe, mantida"
} else {
  Write-Host "  !!  LuckyPenny:LicenseKey não definida. Configure com:"
  Write-Host '      $env:LUCKYPENNY_LICENSE_KEY = "<sua-chave>"; .\server\scripts\setup-user-secrets.ps1'
}

Write-Host ""
Write-Host "Pronto. Para conferir (os valores aparecem em texto puro):"
Write-Host "  dotnet user-secrets list --project $projeto"
