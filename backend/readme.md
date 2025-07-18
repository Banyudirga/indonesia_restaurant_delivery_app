# Seblak Delivery App

A comprehensive food delivery application specializing in Indonesian Seblak cuisine, built for the Indonesian market.

## Project Overview

Seblak Delivery is a multi-platform food delivery system that connects customers with local Seblak restaurants across Indonesia. The app features real-time order tracking, multiple payment methods (including QRIS, GoPay, OVO, DANA), and seamless delivery management.

## Architecture

The project consists of several interconnected components:

- **Mobile Apps**: Customer and delivery partner mobile applications
- **Web Admin Panel**: Restaurant management system
- **Backend API**: Core business logic and data management
- **Database**: PostgreSQL with Redis caching
- **Payment Gateway**: Integration with Indonesian payment providers

## Project Structure

```
seblak-delivery/
├── backend/                 # API server and backend services
├── mobile_customer/         # Customer mobile app (React Native)
├── mobile_delivery/         # Delivery partner mobile app (React Native)
├── admin_panel/            # Web admin panel for restaurant management
├── database/               # Database schemas and migrations
├── docs/                   # Documentation and API specs
├── docker/                 # Docker configuration files
└── scripts/                # Deployment and utility scripts
```

## Tech Stack

- **Mobile**: React Native
- **Backend**: Node.js with Express.js
- **Database**: PostgreSQL + Redis
- **Payment**: QRIS, GoPay, OVO, DANA integrations
- **Real-time**: Socket.io for order tracking
- **Maps**: Google Maps API
- **Deployment**: Docker + AWS/GCP

## Getting Started

1. Clone the repository
2. Install dependencies for each component
3. Set up environment variables
4. Initialize the database
5. Run the development servers

See individual component READMEs for detailed setup instructions.

## Features

### Customer App
- Browse local Seblak restaurants
- Customize spice levels and toppings
- Real-time order tracking
- Multiple payment options
- Order history and favorites

### Delivery Partner App
- Accept/decline delivery requests
- GPS navigation
- Earnings tracking
- Real-time order updates

### Admin Panel
- Restaurant management
- Menu and pricing controls
- Order monitoring
- Analytics dashboard

## License

MIT License
