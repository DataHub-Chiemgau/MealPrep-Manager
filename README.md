# MealPrep Manager

A meal-prep planning and inventory management application built with [Next.js](https://nextjs.org), Prisma (SQLite) and Tailwind CSS.

## Production Installation (Ubuntu 24.04 LTS)

The included `install.sh` script sets up everything on a fresh Ubuntu 24.04 server: Node.js, PM2, Nginx reverse-proxy, UFW firewall and the application itself.

```bash
git clone https://github.com/DataHub-Chiemgau/MealPrep-Manager.git
cd MealPrep-Manager
sudo ./install.sh
```

> **Note:** On Linux use `./install.sh` (forward slash), not `.\install.sh` (backslash).

After installation, edit the environment file and set strong secrets:

```bash
sudo -u mealprep nano MealPrep-Manager/.env
# Set ADMIN_PASSWORD and SHOP_PIN, then restart:
sudo -u mealprep pm2 restart mealprep-manager
```

## Local Development

```bash
# Install dependencies
npm ci

# Copy environment template and adjust values
cp .env.example .env

# Run database migrations
npx prisma migrate deploy

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Learn More

- [Next.js Documentation](https://nextjs.org/docs) – learn about Next.js features and API.
- [Prisma Documentation](https://www.prisma.io/docs) – learn about the Prisma ORM.
