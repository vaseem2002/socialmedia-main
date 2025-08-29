# Connectify - Modern Social Media Platform

![MERN](https://img.shields.io/badge/Stack-MERN-00b4d8)
![License](https://img.shields.io/badge/License-MIT-success)
![Version](https://img.shields.io/badge/Version-1.0.0-blue)

## Overview

Connectify is a full-featured social networking platform built with the MERN stack (MongoDB, Express.js, React, Node.js), designed to deliver a seamless user experience with real-time interactions. The platform combines core social media functionality with advanced features like group management and real-time messaging.

## Key Features

### 🚀 Core Functionality
- **User Authentication**: Secure JWT-based registration/login with email verification
- **Profile Management**: Customizable public/private profiles with media uploads
- **Content System**: Rich post creation with images, likes, and comments

### 💬 Social Interactions
- **Relationship System**: Follow/unfollow users with privacy controls
- **Engagement Tools**: Like, comment, and save posts
- **Activity Feed**: Personalized content discovery algorithm

### 💻 Communication
- **Real-time Chat**: Socket.io powered 1:1 messaging
- **Group Management**: Public/private groups with admin controls
- **Notifications**: Real-time alerts for all user activities

### 🛠️ Technical Highlights
- **Responsive UI**: Mobile-first design with dark/light modes
- **Performance**: Optimized API calls with React Query
- **Security**: Protected routes with role-based access control

## Technology Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| React 18 | Component-based UI |
| Redux Toolkit | State management |
| Material-UI | Design system components |
| Socket.io | Real-time communication |
| React Hook Form | Form handling |
| Axios | HTTP client |

### Backend
| Technology | Purpose |
|------------|---------|
| Node.js 16+ | Runtime environment |
| Express.js | REST API framework |
| MongoDB | NoSQL database |
| Mongoose | ODM for MongoDB |
| JWT | Authentication tokens |
| Bcrypt | Password hashing |
| Cloudinary | Media storage |


## Installation

### Prerequisites
- Node.js v16+
- MongoDB Atlas account or local MongoDB v5+
- Cloudinary account (for media storage)

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/balajikarthik2004/socialmedia.git
   cd socialmedia

2. **Configure environment variables**
    ```bash
    cp server/.env frontend/.env
    cp client/.env backend/.env

3. **Install dependencies**

    # Install server dependencies
        cd backend && npm install

    # Install client dependencies
        cd ../frontend && npm install

4. **Start development servers**
# From project root
    ```bash
    npm run dev
  
# Deployment

# Build client application
    cd frontend && npm run build

# Start production server
    cd ../backend && npm start

Environment Variables
backend (.env)
 ```bash
    NODE_ENV=production
    PORT=5000
    MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/nexusconnect
    JWT_SECRET=your_secure_jwt_secret
    JWT_EXPIRES_IN=30d
    CLOUDINARY_CLOUD_NAME=your_cloud_name
    CLOUDINARY_API_KEY=your_api_key
    CLOUDINARY_API_SECRET=your_api_secret
```

**frontend (.env)**
```bash
    REACT_APP_API_BASE_URL=/api/v1
    REACT_APP_SOCKET_URL=wss://yourdomain.com
```

**Contributing**
**We welcome contributions! Please follow these guidelines:**

*Fork the repository*

Create a feature branch (git checkout -b feature/your-feature)

Commit your changes (git commit -m 'Add some feature')

Push to the branch (git push origin feature/your-feature)

Open a pull request

**License**
Distributed under the MIT License. See LICENSE for more information.

**Contact**
Project Maintainer: **vaseem**
Email: svaseemm@gmail.con
Project Link: https://kb-connectify.vercel.app/
