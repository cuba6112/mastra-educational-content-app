# Educational Content Generator - Frontend

A modern Next.js 15 frontend application for the AI-powered educational content generation system. This frontend provides an intuitive interface for generating comprehensive educational materials with real-time progress tracking.

## 🚀 Features

- **Modern React Interface**: Built with Next.js 15 and React 19
- **Real-Time Progress Tracking**: Live workflow status updates with detailed step progression  
- **Responsive Design**: Mobile-first design using Tailwind CSS
- **Type Safety**: Full TypeScript implementation with strict type checking
- **Accessible UI**: Radix UI components for consistent accessibility
- **Content Management**: Form handling with validation and error states
- **Progress Visualization**: Progress bars, status badges, and step indicators

## 🏗️ Architecture

### Technology Stack

- **Next.js 15**: React framework with App Router
- **React 19**: Latest React with concurrent features  
- **TypeScript**: Static type checking
- **Tailwind CSS**: Utility-first CSS framework
- **Radix UI**: Accessible component primitives
- **React Hook Form + Zod**: Form management with validation
- **Lucide React**: Icon library
- **Zustand**: Lightweight state management

### Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── page.tsx                 # Main content generation page
│   │   ├── layout.tsx               # Root layout component
│   │   └── globals.css              # Global styles
│   ├── components/
│   │   ├── ui/                      # Reusable UI components
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── card.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── progress.tsx
│   │   │   └── tabs.tsx
│   │   └── WorkflowProgress.tsx     # Real-time progress tracking
│   └── lib/
│       └── utils.ts                 # Utility functions
├── public/                          # Static assets
├── package.json                     # Dependencies and scripts
├── tailwind.config.js              # Tailwind configuration
├── tsconfig.json                    # TypeScript configuration
└── next.config.js                   # Next.js configuration
```

## 🚦 Getting Started

### Prerequisites

- Node.js 20.9.0 or higher
- npm or yarn package manager
- Backend server running on port 5001

### Installation

1. **Navigate to frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```

4. **Open application**:
   Visit [http://localhost:3000](http://localhost:3000) in your browser

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server  
- `npm run lint` - Run ESLint

## 📱 User Interface

### Main Features

1. **Content Generation Form**
   - Topic input with validation
   - Target audience specification  
   - Word count slider (1,000 - 100,000 words)
   - Generate button with loading states

2. **Real-Time Progress Tracking**
   - Overall progress percentage
   - Current step indicator
   - Detailed step status (pending, in_progress, completed, failed)
   - Step duration tracking
   - Error handling and retry options

3. **Result Display**
   - Success notification with word count
   - Download options (when available)
   - Reset functionality for new generations

## 🔌 API Integration

### Backend Endpoints

The frontend communicates with these backend API endpoints:

1. **Start Workflow**:
   ```
   POST /api/workflows/improvedEducationalContentWorkflow/start-async
   ```
   - Starts content generation workflow
   - Returns workflow ID for tracking

2. **Progress Tracking**:
   ```
   GET /api/workflows/{workflowId}/progress
   ```
   - Polls for real-time workflow status
   - Returns step details and completion percentage

## 🎨 Styling

### Design System

- **Colors**: Blue primary, green success, red error, gray neutrals
- **Typography**: System font stack with size scale
- **Spacing**: Consistent 4px grid system
- **Shadows**: Subtle depth with multiple layers

### Responsive Design

- **Mobile-first**: Optimized for mobile devices
- **Breakpoints**: sm (640px), md (768px), lg (1024px), xl (1280px)
- **Grid System**: CSS Grid and Flexbox layouts

## 🚀 Deployment

### Production Build

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Start production server**:
   ```bash
   npm start
   ```

## 🐛 Troubleshooting

### Common Issues

1. **Development Server Won't Start**
   - Check Node.js version (≥20.9.0)
   - Delete node_modules and reinstall
   - Check port 3000 availability

2. **API Connection Failures**  
   - Verify backend is running on port 5001
   - Check CORS configuration
   - Validate API endpoints

## 📄 Usage

1. **Start the Backend**: Ensure the backend server is running on port 5001
2. **Launch Frontend**: Run `npm run dev` to start the development server
3. **Generate Content**: 
   - Fill in the content topic (e.g., "Advanced JavaScript Programming")
   - Specify target audience (e.g., "Intermediate developers")
   - Set desired word count (1,000-100,000)
   - Click "Generate Content"
4. **Monitor Progress**: Watch real-time workflow progress with detailed steps
5. **View Results**: Access generated content when workflow completes

---

*Built with ❤️ using Next.js and modern web technologies.*