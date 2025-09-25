# VowNow Admin Dashboard

A standalone Next.js application for managing the VowNow platform.

## Features

- 📊 **Dashboard Overview**: Real-time metrics and analytics
- 👥 **User Management**: View, filter, and manage user accounts
- 📈 **Analytics**: Comprehensive analytics with charts and reports
- ⚙️ **System Settings**: Configure application settings
- 🛡️ **Content Moderation**: Review and moderate user content
- 📝 **Reports**: Generate and export various reports

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **UI**: React 19, TypeScript 5
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Icons**: Lucide React
- **Backend**: Supabase
- **Authentication**: Supabase Auth with admin role checking

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- Supabase account with admin user configured

### Default Admin Credentials

```
Email:    admin@vownow.com
Password: Admin@123456
```

⚠️ **IMPORTANT**: Change these credentials in production! See [ADMIN_CREDENTIALS.md](./ADMIN_CREDENTIALS.md) for details.

### Installation

1. Clone the repository
2. Navigate to the admin-dashboard directory
3. Copy the environment variables:
   ```bash
   cp .env.local.example .env.local
   ```
4. Update `.env.local` with your Supabase credentials
5. Install dependencies:
   ```bash
   pnpm install
   ```

### Development

Run the development server on port 3001:

```bash
pnpm dev
```

Open [http://localhost:3001](http://localhost:3001) to view the admin dashboard.

### Production

Build the application:

```bash
pnpm build
```

Start the production server:

```bash
pnpm start
```

## Project Structure

```
admin-dashboard/
├── app/                    # Next.js app router pages
│   ├── admin/             # Admin routes
│   │   ├── users/         # User management
│   │   ├── analytics/     # Analytics dashboard
│   │   ├── settings/      # System settings
│   │   ├── moderation/    # Content moderation
│   │   └── reports/       # Reports generation
│   └── api/               # API routes
├── components/            # React components
│   └── admin/            # Admin-specific components
├── lib/                   # Utility functions
│   └── admin/            # Admin auth and utilities
└── public/               # Static assets
```

## Authentication

The admin dashboard uses Supabase authentication with role-based access control:

1. Users must have `role = 'admin'` in the profiles table
2. Sessions are managed with HTTP-only cookies
3. Service role key is required for admin operations

## Environment Variables

Required environment variables:

- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key (keep secret!)

## Security

- Admin routes are protected by authentication middleware
- Service role key should never be exposed to the client
- All admin actions are logged for audit purposes

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

Private - VowNow Internal Use Only