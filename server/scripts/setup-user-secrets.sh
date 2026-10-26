#!/usr/bin/env bash
# Configura os User Secrets necessários para rodar a API em desenvolvimento.
# Nenhum desses valores deve ir para o appsettings.json nem para o
# appsettings.Development.json: eles ficam fora do repositório, em
# ~/.microsoft/usersecrets/NoteKeeper/secrets.json.
#
# Uso (de qualquer pasta):
#   ./server/scripts/setup-user-secrets.sh
#
# Variáveis opcionais:
#   NOTEKEEPER_SQL_CONNECTION   connection string do SQL Server (padrão: o do docker-compose.yml)
#   LUCKYPENNY_LICENSE_KEY      chave de licença do Lucky Penny (MediatR)

set -euo pipefail

PROJETO="$(cd "$(dirname "${BASH_SOURCE[0]}")/../src/Api" && pwd)/NoteKeeper.Api.csproj"

segredo() {
  dotnet user-secrets set "$1" "$2" --project "$PROJETO" > /dev/null
  echo "  ok  $1"
}

existe() {
  dotnet user-secrets list --project "$PROJETO" 2>/dev/null | grep -q "^$1 ="
}

echo "Configurando User Secrets de $PROJETO..."

# 1. Connection string (padrão = SQL Server do docker-compose.yml deste repositório)
CONEXAO="${NOTEKEEPER_SQL_CONNECTION:-Server=localhost,1433;Database=NoteKeeperDb;User Id=sa;Password=Academia@2026!;TrustServerCertificate=True}"
segredo "ConnectionStrings:SqlServer" "$CONEXAO"

# 2. Chave de assinatura do JWT (mínimo 32 bytes). Gerada uma vez; não é sobrescrita.
if existe "Jwt:SigningKey"; then
  echo "  --  Jwt:SigningKey já existe, mantida"
else
  if command -v openssl > /dev/null; then
    CHAVE="$(openssl rand -base64 48)"
  else
    CHAVE="$(head -c 48 /dev/urandom | base64)"
  fi
  segredo "Jwt:SigningKey" "$CHAVE"
fi

# 3. Licença do Lucky Penny (MediatR): é uma chave sua, então não é gerada aqui.
if [ -n "${LUCKYPENNY_LICENSE_KEY:-}" ]; then
  segredo "LuckyPenny:LicenseKey" "$LUCKYPENNY_LICENSE_KEY"
elif existe "LuckyPenny:LicenseKey"; then
  echo "  --  LuckyPenny:LicenseKey já existe, mantida"
else
  echo "  !!  LuckyPenny:LicenseKey não definida. Configure com:"
  echo "      LUCKYPENNY_LICENSE_KEY='<sua-chave>' ./server/scripts/setup-user-secrets.sh"
fi

echo
echo "Pronto. Para conferir (os valores aparecem em texto puro):"
echo "  dotnet user-secrets list --project $PROJETO"
