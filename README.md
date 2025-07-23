# VulnWatch AI

A beautiful, fully automated vulnerability scanning SaaS powered by AI and built on OpenVAS.

## Features

- 🚀 **Real-time Vulnerability Scanning**: Continuous monitoring with instant alerts
- 🤖 **AI-Powered Analysis**: Smart prioritization and false-positive reduction
- 🎨 **Stunning UI**: Dark mode, neon accents, smooth animations, and glassmorphism
- 💳 **Stripe Integration**: Instant signup and subscription management
- 🔧 **DevOps Ready**: CI/CD pipeline integration with GitHub, GitLab, and more
- 📊 **Compliance Reports**: Built-in SOC2, HIPAA, PCI-DSS compliance reporting

## Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS
- **shadcn/ui** - Beautiful UI components
- **Lucide Icons** - Modern icon library

### Backend
- **FastAPI** - Modern Python web framework
- **PostgreSQL** - Primary database
- **Redis** - Caching and job queue
- **Celery** - Background task processing
- **SQLAlchemy** - ORM
- **Stripe** - Payment processing
- **OpenVAS** - Vulnerability scanning engine

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Node.js 20+ (for local development)
- Python 3.11+ (for local development)

### Quick Start with Docker

1. Clone the repository:
```bash
git clone https://github.com/yourusername/vulnwatch-ai.git
cd vulnwatch-ai
```

2. Create environment file:
```bash
cp backend/.env.example backend/.env
# Edit backend/.env with your configuration
```

3. Start all services:
```bash
docker-compose up -d
```

4. Access the application:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

### Local Development

#### Frontend

```bash
npm install
npm run dev
```

#### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Configuration

### Environment Variables

#### Backend (.env)
- `SECRET_KEY` - JWT secret key
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `STRIPE_SECRET_KEY` - Stripe API secret key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret
- `OPENVAS_HOST` - OpenVAS server host
- `OPENVAS_PASSWORD` - OpenVAS admin password

#### Frontend
- `NEXT_PUBLIC_API_URL` - Backend API URL
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key

## Architecture

```
vulnwatch-ai/
├── app/                  # Next.js app router
├── components/           # React components
├── lib/                  # Utilities
├── backend/              # FastAPI backend
│   └── app/
│       ├── api/         # API routes
│       ├── core/        # Core configuration
│       ├── db/          # Database models
│       ├── models/      # SQLAlchemy models
│       ├── schemas/     # Pydantic schemas
│       └── services/    # Business logic
└── docker-compose.yml    # Docker orchestration
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built on top of [OpenVAS](https://www.openvas.org/) by Greenbone Networks
- UI inspired by modern cybersecurity platforms
- Icons from [Lucide](https://lucide.dev/)