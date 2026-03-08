#!/usr/bin/env bash
# =============================================================================
# MealPrep Manager – Production Install Script
# Target OS : Ubuntu 24.04 LTS (fresh server)
# Usage     : sudo bash install.sh
# =============================================================================
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_PORT=3000
NGINX_SITE="mealprep-manager"
PM2_APP_NAME="mealprep-manager"
APP_USER="mealprep"

# ── Colour helpers ────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
info()    { echo -e "${GREEN}[INFO]${NC}  $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error()   { echo -e "${RED}[ERROR]${NC} $*" >&2; exit 1; }

# ── Root check ────────────────────────────────────────────────────────────────
if [[ $EUID -ne 0 ]]; then
  error "Please run this script as root: sudo bash install.sh"
fi

# =============================================================================
# 1. System updates
# =============================================================================
info "Updating system packages..."
apt-get update -y
DEBIAN_FRONTEND=noninteractive apt-get upgrade -y

# =============================================================================
# 2. System dependencies
# =============================================================================
info "Installing system dependencies..."
DEBIAN_FRONTEND=noninteractive apt-get install -y \
  curl \
  git \
  build-essential \
  ca-certificates \
  gnupg \
  lsb-release \
  nginx \
  ufw \
  tesseract-ocr \
  tesseract-ocr-deu

# =============================================================================
# 3. Node.js LTS via NodeSource
# =============================================================================
if ! command -v node &>/dev/null; then
  info "Installing Node.js LTS via NodeSource..."
  curl -fsSL https://deb.nodesource.com/setup_lts.x | bash -
  DEBIAN_FRONTEND=noninteractive apt-get install -y nodejs
else
  NODE_VER=$(node --version)
  info "Node.js already installed: ${NODE_VER}"
fi

info "Node.js version: $(node --version)"
info "npm version:     $(npm --version)"

# =============================================================================
# 4. PM2 (process manager)
# =============================================================================
if ! command -v pm2 &>/dev/null; then
  info "Installing PM2 globally..."
  npm install -g pm2
else
  info "PM2 already installed: $(pm2 --version)"
fi

# =============================================================================
# 5. Dedicated application user (non-root)
# =============================================================================
if ! id "${APP_USER}" &>/dev/null; then
  info "Creating dedicated application user '${APP_USER}'..."
  useradd --system --shell /bin/bash --create-home "${APP_USER}"
fi

# Ensure the application directory is owned by the app user
chown -R "${APP_USER}:${APP_USER}" "${APP_DIR}"

# =============================================================================
# 6. Application dependencies & build
# =============================================================================
info "Installing all npm dependencies (including devDependencies for build)..."
cd "${APP_DIR}"
sudo -u "${APP_USER}" npm ci

info "Generating Prisma client..."
sudo -u "${APP_USER}" npx prisma generate

info "Running database migrations..."
sudo -u "${APP_USER}" npx prisma migrate deploy

info "Building Next.js application..."
sudo -u "${APP_USER}" npm run build

info "Pruning development dependencies..."
sudo -u "${APP_USER}" npm ci --omit=dev

# =============================================================================
# 7. Environment file
# =============================================================================
if [[ ! -f "${APP_DIR}/.env" ]]; then
  warn ".env file not found – copying from .env.example."
  warn "Make sure to set strong ADMIN_PASSWORD and SHOP_PIN in .env before going live!"
  sudo -u "${APP_USER}" cp "${APP_DIR}/.env.example" "${APP_DIR}/.env"
fi

# =============================================================================
# 8. PM2 – start / restart app as dedicated user and set up autostart
# =============================================================================
info "Starting application with PM2 as user '${APP_USER}'..."
sudo -u "${APP_USER}" pm2 delete "${PM2_APP_NAME}" 2>/dev/null || true
sudo -u "${APP_USER}" pm2 start npm \
  --name "${PM2_APP_NAME}" \
  --cwd "${APP_DIR}" \
  -- start

info "Saving PM2 process list..."
sudo -u "${APP_USER}" pm2 save

info "Configuring PM2 systemd startup for user '${APP_USER}'..."
APP_USER_HOME="$(getent passwd "${APP_USER}" | cut -d: -f6)"
env PATH="${PATH}" pm2 startup systemd -u "${APP_USER}" --hp "${APP_USER_HOME}"
systemctl enable "pm2-${APP_USER}"

# =============================================================================
# 9. Nginx – reverse proxy configuration
# =============================================================================
info "Configuring Nginx as reverse proxy (port 80 -> ${APP_PORT})..."

NGINX_CONF="/etc/nginx/sites-available/${NGINX_SITE}"
cat > "${NGINX_CONF}" << NGINX_EOF
server {
    listen 80;
    listen [::]:80;
    server_name _;

    # Increase client_max_body_size for receipt image uploads (matches 10 MB app limit)
    client_max_body_size 11M;

    # Recommended proxy headers
    proxy_http_version 1.1;
    proxy_set_header   Upgrade           \$http_upgrade;
    proxy_set_header   Connection        "upgrade";
    proxy_set_header   Host              \$host;
    proxy_set_header   X-Real-IP         \$remote_addr;
    proxy_set_header   X-Forwarded-For   \$proxy_add_x_forwarded_for;
    proxy_set_header   X-Forwarded-Proto \$scheme;

    location / {
        proxy_pass http://127.0.0.1:${APP_PORT};
    }
}
NGINX_EOF

# Enable the site
ln -sf "${NGINX_CONF}" /etc/nginx/sites-enabled/"${NGINX_SITE}"
# Disable the default site if it exists
rm -f /etc/nginx/sites-enabled/default

nginx -t
systemctl enable nginx
systemctl restart nginx

# =============================================================================
# 10. UFW firewall
# =============================================================================
info "Configuring UFW firewall..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 'Nginx HTTP'
ufw allow 'Nginx HTTPS'
ufw --force enable

info "UFW status:"
ufw status verbose

# =============================================================================
# Done
# =============================================================================
echo ""
echo -e "${GREEN}========================================================${NC}"
echo -e "${GREEN}  MealPrep Manager installed successfully!             ${NC}"
echo -e "${GREEN}========================================================${NC}"
echo ""
echo "  Application directory : ${APP_DIR}"
echo "  Application user      : ${APP_USER}"
echo "  PM2 app name          : ${PM2_APP_NAME}"
echo "  Listening on          : http://0.0.0.0 (Nginx -> port ${APP_PORT})"
echo ""
warn "Don't forget to:"
warn "  1. Edit ${APP_DIR}/.env and set strong ADMIN_PASSWORD and SHOP_PIN."
warn "  2. Restart the app after changing .env:  sudo -u ${APP_USER} pm2 restart ${PM2_APP_NAME}"
warn "  3. Set up HTTPS with Certbot for production use:"
warn "       apt install certbot python3-certbot-nginx"
warn "       certbot --nginx -d your-domain.example.com"
echo ""
