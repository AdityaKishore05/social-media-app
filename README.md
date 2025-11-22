# FullStack Social Media App

A fully functional social media application built using the MERN stack (MongoDB, Express, React, Node.js). This application allows users to register, login (including Google Auth), create posts with images, like/comment on posts, add friends, and view user profiles.

## 🚀 Features

*   **Authentication & Authorization**:
    *   User Registration and Login with JWT.
    *   Google OAuth Integration.
    *   Password Encryption using Bcrypt.
*   **Social Interactions**:
    *   Create Posts with Image Uploads.
    *   Like and Comment on Posts.
    *   Add and Remove Friends.
    *   View User Profiles.
*   **UI/UX**:
    *   Responsive Design (Mobile & Desktop).
    *   Dark/Light Mode Toggle.
    *   Modern UI using Material UI (MUI).
*   **Backend**:
    *   RESTful API with Express.
    *   Image Storage with Cloudinary.
    *   Security features (Helmet, Rate Limiting).

## 🛠 Tech Stack

### Frontend
*   **React** (v18)
*   **Redux Toolkit** & **Redux Persist** (State Management)
*   **Material UI (MUI)** (Component Library)
*   **Formik** & **Yup** (Form Handling & Validation)
*   **React Router DOM** (Routing)
*   **React Dropzone** (File Uploads)
*   **React Toastify** (Notifications)

### Backend
*   **Node.js** & **Express.js**
*   **MongoDB** & **Mongoose** (Database)
*   **JWT** (Authentication)
*   **Multer** & **Cloudinary** (File Storage)
*   **Helmet** & **Morgan** (Security & Logging)

## ⚙️ Prerequisites

Before running the application, ensure you have the following installed:
*   [Node.js](https://nodejs.org/) (v14+ recommended)
*   [MongoDB](https://www.mongodb.com/) (Local or Atlas)
*   A [Cloudinary](https://cloudinary.com/) Account
*   A [Google Cloud Console](https://console.cloud.google.com/) Project (for Google Sign-In)

## 🔧 Installation & Setup

### 1. Clone the Repository
\`\`\`bash
git clone <repository-url>
cd social-media-project
\`\`\`

### 2. Backend Setup
Navigate to the server directory and install dependencies:
\`\`\`bash
cd server
npm install
\`\`\`

Create a \`.env\` file in the \`server\` directory with the following variables:
\`\`\`env
PORT=6001
MONGO_URL=your_mongodb_connection_string
JWT_SECRET=your_super_secret_jwt_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
\`\`\`

### 3. Frontend Setup
Navigate to the client directory and install dependencies:
\`\`\`bash
cd ../client
npm install
\`\`\`

Create a \`.env\` file in the \`client\` directory:
\`\`\`env
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id
\`\`\`

## 🏃‍♂️ Running the Application

### Start the Backend Server
\`\`\`bash
cd server
npm start
\`\`\`
The server will run on \`http://localhost:6001\`.

### Start the Frontend Client
Open a new terminal:
\`\`\`bash
cd client
npm start
\`\`\`
The application will open in your browser at \`http://localhost:3000\`.

## 📂 Project Structure

\`\`\`
social-media-project/
├── client/                 # React Frontend
│   ├── public/
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── scenes/         # Page views (Home, Login, Profile)
│   │   ├── state/          # Redux slices
│   │   └── ...
│   └── package.json
├── server/                 # Express Backend
│   ├── config/             # Configurations (Cloudinary, etc.)
│   ├── controllers/        # Route logic
│   ├── middleware/         # Auth, Uploads, Security
│   ├── models/             # Mongoose Schemas
│   ├── routes/             # API Routes
│   ├── index.js            # Entry point
│   └── package.json
└── README.md
\`\`\`

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
