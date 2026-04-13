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

During the installation you will be prompted for the **Admin Password** and the **Shop PIN**. You can press Enter to keep the defaults and change them later.

### Accessing the Web Interface

After a successful installation the application is available at:

```
http://<server-ip>
```

Replace `<server-ip>` with the IP address or hostname of your server. Nginx listens on port **80** and forwards requests to the Next.js application.

> **Tip:** To find the server's IP address run `hostname -I` or `ip addr` on the server.

### Environment File (`.env`)

The install script deploys the application to `/opt/mealprep-manager`. The environment file is located at:

```
/opt/mealprep-manager/.env
```

If you want to change the admin password or shop PIN after installation:

```bash
sudo -u mealprep nano /opt/mealprep-manager/.env
# Edit ADMIN_PASSWORD and SHOP_PIN, then restart:
sudo -u mealprep pm2 restart mealprep-manager
```

### Troubleshooting

| Problem | Possible cause | Solution |
|---|---|---|
| Web interface not reachable | Nginx is not running | `sudo systemctl status nginx` — if inactive: `sudo systemctl start nginx` |
| Web interface not reachable | App is not running | `sudo -u mealprep pm2 status` — if stopped: `sudo -u mealprep pm2 start mealprep-manager` |
| Web interface not reachable | Firewall blocks port 80 | `sudo ufw status` — port 80 must be allowed (`sudo ufw allow 'Nginx HTTP'`) |
| 502 Bad Gateway | App crashed or is still starting | Check app logs: `sudo -u mealprep pm2 logs mealprep-manager` |
| `.env` not found | Looking in wrong directory | The file is at `/opt/mealprep-manager/.env`, **not** in the git clone directory |

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

> **Important:** The `.env` file is not included in the repository (it is listed in `.gitignore`).
> Copy the template first: `cp .env.example .env` and adjust the values.

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Learn More

- [Next.js Documentation](https://nextjs.org/docs) – learn about Next.js features and API.
- [Prisma Documentation](https://www.prisma.io/docs) – learn about the Prisma ORM.
