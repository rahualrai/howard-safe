# Howard Safe

A comprehensive campus safety application designed to enhance security and communication within the Howard University community.

## Overview

Howard Safe is a React-based web application that provides students, faculty, and staff with essential safety tools including incident reporting, real-time campus maps, emergency contacts, and safety resources. The platform focuses on creating a secure and connected campus environment.

## Features

- **Incident Reporting**: Secure incident reporting system with photo upload capabilities
- **Interactive Campus Maps**: Google Maps integration showing safe zones, well-lit areas, and incident locations
- **User Authentication**: Secure login and profile management
- **Student Hub**: Access to digital ID, dining services, events calendar, and quick links
- **Safety Resources**: Emergency contacts, safety tips, and campus security information
- **Mobile Responsive**: Optimized for both desktop and mobile devices

## Getting Started

### Prerequisites

- Node.js 16+ and npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
- Supabase account for database and authentication

### Installation

1. Clone the repository:
```sh
git clone https://github.com/rahualrai/howard-safe.git
```

2. Navigate to the project directory:
```sh
cd howard-safe
```

3. Install dependencies:
```sh
npm install
```

4. Set up environment variables:
```sh
cp .env.example .env
```
Edit `.env` with your Supabase credentials and other configuration values.

5. Start the development server:
```sh
npm run dev
```

The application will be available at `http://localhost:8080`

## Technology Stack

This project is built with modern web technologies:

- **Frontend Framework**: React 18+ with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Components**: shadcn/ui component library
- **Styling**: Tailwind CSS for utility-first styling
- **Backend**: Supabase for authentication, database, and serverless functions
- **Maps**: Google Maps API for interactive campus mapping
- **Mobile**: Capacitor for native mobile app capabilities
- **State Management**: React hooks and context
- **Form Handling**: React Hook Form with Zod validation

## Development Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint for code quality

## Project Structure

```
src/
├── components/          # Reusable UI components
├── pages/              # Main application pages
├── hooks/              # Custom React hooks
├── integrations/       # Third-party service integrations
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
└── assets/             # Static assets
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Security

This application implements several security measures:
- Environment variable protection for sensitive credentials
- Row Level Security (RLS) policies in Supabase
- Input sanitization and validation
- Rate limiting for API endpoints
- TypeScript strict mode for type safety

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support or questions, please contact the development team or create an issue in the GitHub repository.
