#!/bin/bash

# ==============================================================================
# Script to generate a self-signed SSL certificate for a specific domain.
# ==============================================================================

# --- Configuration ---
DOMAIN="dap.cxsaaslab.com"
DAYS=3650 # 10 years (10 * 365)
KEY_FILE="/etc/pki/tls/private/${DOMAIN}.key"
CERT_FILE="/etc/pki/tls/certs/${DOMAIN}.crt"

# --- Certificate Subject Information ---
COUNTRY="US"
STATE="New Jersey"
LOCALITY="Edison"
ORG="CXSAASLAB"
ORG_UNIT="CX"

# --- Pre-flight Check ---
# Check if the script is run as root
if [ "$(id -u)" -ne 0 ]; then
  echo "❌ This script must be run as root. Please use sudo." >&2
  exit 1
fi

echo "🚀 Starting self-signed certificate generation for ${DOMAIN}..."

# --- Generate Certificate and Key ---
openssl req \
  -x509 \
  -nodes \
  -newkey rsa:2048 \
  -keyout "${KEY_FILE}" \
  -out "${CERT_FILE}" \
  -days "${DAYS}" \
  -subj "/C=${COUNTRY}/ST=${STATE}/L=${LOCALITY}/O=${ORG}/OU=${ORG_UNIT}/CN=${DOMAIN}" \
  -addext "subjectAltName = DNS:${DOMAIN}"

# Check if openssl command was successful
if [ $? -ne 0 ]; then
    echo "❌ Certificate generation failed." >&2
    exit 1
fi

echo "🔐 Setting secure permissions for the private key..."
chmod 600 "${KEY_FILE}"

echo ""
echo "✅ Success! Certificate generation is complete."
echo "--------------------------------------------------"
echo "Your certificate is located at: ${CERT_FILE}"
echo "Your private key is located at: ${KEY_FILE}"
echo "--------------------------------------------------"
echo "⚠️  Reminder: This is a self-signed certificate and will cause browser warnings."

exit 0
