# Frontend Design Specification
## Educational Content Generation Application

## Project Overview

A modern React-based frontend for the Educational Content Generation system that provides an intuitive interface for creating, monitoring, and managing educational content through AI-powered workflows. The application focuses on real-time progress tracking, seamless content generation, and professional educational content delivery.

## Technology Stack

### Core Technologies
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript 5.0+
- **Styling**: Tailwind CSS v4
- **Components**: shadcn/ui + Radix UI primitives
- **State Management**: Zustand + React Query (TanStack Query)
- **Real-time**: WebSocket with fallback to Server-Sent Events
- **Forms**: React Hook Form + Zod validation
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **Charts**: Recharts
- **Build Tool**: Next.js built-in bundler
- **Package Manager**: npm

### Development Tools
- **Linting**: ESLint + Prettier
- **Type Checking**: TypeScript strict mode
- **Testing**: Jest + React Testing Library
- **E2E Testing**: Playwright
- **Development**: Next.js development server with hot reload

## Design System Foundation

### Color Palette

```typescript
// Primary Brand Colors
const colors = {
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe', 
    500: '#0ea5e9',  // Main brand color
    600: '#0284c7',
    900: '#0c4a6e'
  },
  
  // Semantic Colors
  success: {
    50: '#f0fdf4',
    500: '#22c55e',
    600: '#16a34a'
  },
  
  warning: {
    50: '#fffbeb',
    500: '#f59e0b',
    600: '#d97706'
  },
  
  error: {
    50: '#fef2f2',
    500: '#ef4444',
    600: '#dc2626'
  },
  
  // Neutral Colors
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827'
  }
}
```

### Typography Scale

```typescript
// Font Configuration
const typography = {
  fontFamily: {
    sans: ['Inter', 'system-ui', 'sans-serif'],
    mono: ['JetBrains Mono', 'monospace']
  },
  
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }],
    sm: ['0.875rem', { lineHeight: '1.25rem' }],
    base: ['1rem', { lineHeight: '1.5rem' }],
    lg: ['1.125rem', { lineHeight: '1.75rem' }],
    xl: ['1.25rem', { lineHeight: '1.75rem' }],
    '2xl': ['1.5rem', { lineHeight: '2rem' }],
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }]
  }
}
```

### Spacing System

```typescript
// Consistent spacing using Tailwind's spacing scale
const spacing = {
  xs: '0.25rem', // 4px
  sm: '0.5rem',  // 8px
  md: '1rem',    // 16px
  lg: '1.5rem',  // 24px
  xl: '2rem',    // 32px
  '2xl': '3rem', // 48px
  '3xl': '4rem'  // 64px
}
```

## Component Architecture

### Layout Components

#### AppLayout
**Purpose**: Main application layout with navigation, sidebar, and content areas

**Props Interface**:
```typescript
interface AppLayoutProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  header?: React.ReactNode;
}
```

**Visual Specifications**:
- Fixed header with navigation (64px height)
- Collapsible sidebar (256px width when expanded, 64px when collapsed)
- Main content area with proper spacing and scroll handling
- Responsive breakpoints for mobile/tablet navigation drawer

#### PageHeader
**Purpose**: Consistent page header with title, breadcrumbs, and actions

**Props Interface**:
```typescript
interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
}
```

### Core Feature Components

#### WorkflowCreationForm
**Purpose**: Multi-step form for creating educational content workflows

**Props Interface**:
```typescript
interface WorkflowCreationFormProps {
  onSubmit: (data: WorkflowFormData) => void;
  loading?: boolean;
  initialData?: Partial<WorkflowFormData>;
}

interface WorkflowFormData {
  subject: string;
  topic: string;
  targetAudience: 'elementary' | 'middle' | 'high' | 'college' | 'adult';
  contentType: 'lesson' | 'course' | 'workshop' | 'presentation';
  duration: number;
  objectives: string[];
  prerequisites: string[];
  additionalInstructions?: string;
}
```

**Visual Specifications**:
- Multi-step wizard with progress indicator
- Form validation with inline error messages
- Auto-save draft functionality
- Responsive design with mobile-optimized input fields
- Rich text editor for additional instructions

#### WorkflowProgressTracker
**Purpose**: Real-time progress visualization for content generation

**Props Interface**:
```typescript
interface WorkflowProgressTrackerProps {
  workflowId: string;
  onComplete: (result: WorkflowResult) => void;
  onError: (error: WorkflowError) => void;
}

interface ProgressStep {
  id: string;
  name: string;
  status: 'pending' | 'in-progress' | 'completed' | 'error';
  startTime?: Date;
  endTime?: Date;
  progress: number; // 0-100
  details?: string;
}
```

**Visual Specifications**:
- Animated progress bars with smooth transitions
- Step-by-step visualization with icons and status indicators
- Real-time updates via WebSocket connection
- Time estimates and elapsed time display
- Expandable details for each step

#### ContentPreviewCard
**Purpose**: Preview generated educational content with download options

**Props Interface**:
```typescript
interface ContentPreviewCardProps {
  content: GeneratedContent;
  onDownload: (format: 'pdf' | 'docx' | 'html') => void;
  onEdit: () => void;
  onShare: () => void;
}

interface GeneratedContent {
  id: string;
  title: string;
  type: string;
  createdAt: Date;
  summary: string;
  previewHtml: string;
  downloadUrls: Record<string, string>;
  metadata: ContentMetadata;
}
```

**Visual Specifications**:
- Card-based layout with content preview
- Action buttons for download, edit, and share
- Thumbnail generation for visual preview
- Tag system for content organization
- Quick actions menu with keyboard shortcuts

### UI Components (shadcn/ui based)

#### Button
**Variants**: default, destructive, outline, secondary, ghost, link
**Sizes**: default, sm, lg, icon

#### Input
**Variants**: default, error, success
**Types**: text, email, password, number, textarea

#### Select
**Features**: Single/multi-select, searchable, async loading

#### Dialog
**Usage**: Modals, confirmation dialogs, form overlays

#### Toast
**Types**: success, error, warning, info
**Positions**: top-right, top-center, bottom-right

## State Management Strategy

### Zustand Stores

#### Global App Store
```typescript
interface AppState {
  theme: 'light' | 'dark';
  sidebarCollapsed: boolean;
  user: User | null;
  
  // Actions
  setTheme: (theme: 'light' | 'dark') => void;
  toggleSidebar: () => void;
  setUser: (user: User | null) => void;
}
```

#### Workflow Store
```typescript
interface WorkflowState {
  activeWorkflows: Map<string, WorkflowProgress>;
  workflowHistory: WorkflowResult[];
  
  // Actions
  startWorkflow: (id: string, config: WorkflowConfig) => void;
  updateProgress: (id: string, progress: ProgressUpdate) => void;
  completeWorkflow: (id: string, result: WorkflowResult) => void;
  cancelWorkflow: (id: string) => void;
}
```

### React Query Configuration

```typescript
// API client with interceptors
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 3,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

// Query keys factory
export const queryKeys = {
  workflows: ['workflows'] as const,
  workflow: (id: string) => ['workflow', id] as const,
  workflowHistory: () => ['workflow-history'] as const,
  contentLibrary: (filters?: ContentFilters) => ['content-library', filters] as const,
};
```

## API Integration Strategy

### REST API Client

```typescript
class ApiClient {
  private baseURL: string;
  
  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5001';
  }
  
  // Workflow management
  async startWorkflow(config: WorkflowConfig): Promise<{ workflowId: string }> {
    return this.post('/api/workflows/improvedEducationalContentWorkflow/start-async', config);
  }
  
  async getWorkflowStatus(id: string): Promise<WorkflowStatus> {
    return this.get(`/api/workflows/${id}/status`);
  }
  
  async cancelWorkflow(id: string): Promise<void> {
    return this.delete(`/api/workflows/${id}`);
  }
  
  // Content management
  async downloadContent(id: string, format: string): Promise<Blob> {
    return this.getBlob(`/api/content/${id}/download?format=${format}`);
  }
  
  private async request<T>(endpoint: string, options: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });
    
    if (!response.ok) {
      throw new ApiError(response.status, await response.text());
    }
    
    return response.json();
  }
}
```

### React Query Hooks

```typescript
// Workflow management hooks
export const useStartWorkflow = () => {
  const workflowStore = useWorkflowStore();
  
  return useMutation({
    mutationFn: (config: WorkflowConfig) => apiClient.startWorkflow(config),
    onSuccess: ({ workflowId }) => {
      workflowStore.startWorkflow(workflowId, config);
    },
    onError: (error) => {
      toast.error('Failed to start workflow');
    },
  });
};

export const useWorkflowStatus = (workflowId: string | null) => {
  return useQuery({
    queryKey: queryKeys.workflow(workflowId!),
    queryFn: () => apiClient.getWorkflowStatus(workflowId!),
    enabled: !!workflowId,
    refetchInterval: 2000, // Poll every 2 seconds when active
  });
};

export const useContentLibrary = (filters?: ContentFilters) => {
  return useQuery({
    queryKey: queryKeys.contentLibrary(filters),
    queryFn: () => apiClient.getContentLibrary(filters),
  });
};
```

## Real-time Updates Implementation

### WebSocket Manager

```typescript
class WebSocketManager {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();
  
  connect() {
    try {
      this.ws = new WebSocket(`${wsBaseUrl}/api/ws`);
      this.setupEventListeners();
    } catch (error) {
      console.error('WebSocket connection failed:', error);
      this.fallbackToSSE();
    }
  }
  
  subscribe(event: string, callback: (data: any) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }
  
  private setupEventListeners() {
    if (!this.ws) return;
    
    this.ws.onmessage = (event) => {
      const { type, data } = JSON.parse(event.data);
      this.listeners.get(type)?.forEach(callback => callback(data));
    };
    
    this.ws.onclose = () => {
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        setTimeout(() => {
          this.reconnectAttempts++;
          this.connect();
        }, 1000 * Math.pow(2, this.reconnectAttempts));
      }
    };
  }
  
  private fallbackToSSE() {
    // Fallback to Server-Sent Events for serverless compatibility
    const eventSource = new EventSource(`${apiBaseUrl}/api/events`);
    
    eventSource.onmessage = (event) => {
      const { type, data } = JSON.parse(event.data);
      this.listeners.get(type)?.forEach(callback => callback(data));
    };
  }
}
```

### Real-time Hooks

```typescript
export const useWorkflowProgress = (workflowId: string) => {
  const [progress, setProgress] = useState<ProgressStep[]>([]);
  const wsManager = useWebSocketManager();
  
  useEffect(() => {
    if (!workflowId) return;
    
    const unsubscribe = wsManager.subscribe(
      `workflow:${workflowId}:progress`,
      (data: ProgressUpdate) => {
        setProgress(prev => updateProgressSteps(prev, data));
      }
    );
    
    return unsubscribe;
  }, [workflowId, wsManager]);
  
  return progress;
};

export const useRealtimeNotifications = () => {
  const wsManager = useWebSocketManager();
  
  useEffect(() => {
    const unsubscribe = wsManager.subscribe(
      'notification',
      (notification: Notification) => {
        toast(notification.message, {
          type: notification.type,
          duration: notification.duration,
        });
      }
    );
    
    return unsubscribe;
  }, [wsManager]);
};
```

## Project Structure

```
frontend/
├── src/
│   ├── app/                          # Next.js 14 App Router
│   │   ├── globals.css              # Global styles and Tailwind
│   │   ├── layout.tsx               # Root layout
│   │   ├── page.tsx                 # Dashboard homepage
│   │   ├── workflows/               # Workflow management pages
│   │   │   ├── page.tsx            # Workflow list
│   │   │   ├── create/
│   │   │   │   └── page.tsx        # Workflow creation form
│   │   │   └── [id]/
│   │   │       ├── page.tsx        # Workflow detail/progress
│   │   │       └── edit/
│   │   │           └── page.tsx    # Edit workflow
│   │   ├── content/                # Content management
│   │   │   ├── page.tsx           # Content library
│   │   │   └── [id]/
│   │   │       └── page.tsx       # Content detail/preview
│   │   ├── settings/              # Application settings
│   │   │   └── page.tsx
│   │   └── api/                   # API route handlers (if needed)
│   │
│   ├── components/                # React components
│   │   ├── ui/                   # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── toast.tsx
│   │   │   └── ...
│   │   ├── layout/               # Layout components
│   │   │   ├── app-layout.tsx
│   │   │   ├── header.tsx
│   │   │   ├── sidebar.tsx
│   │   │   └── page-header.tsx
│   │   ├── workflow/             # Workflow-specific components
│   │   │   ├── creation-form.tsx
│   │   │   ├── progress-tracker.tsx
│   │   │   ├── status-card.tsx
│   │   │   └── history-list.tsx
│   │   ├── content/              # Content components
│   │   │   ├── preview-card.tsx
│   │   │   ├── download-menu.tsx
│   │   │   └── content-grid.tsx
│   │   └── common/               # Shared components
│   │       ├── loading-spinner.tsx
│   │       ├── error-boundary.tsx
│   │       ├── confirmation-dialog.tsx
│   │       └── search-input.tsx
│   │
│   ├── lib/                      # Utility libraries
│   │   ├── api-client.ts        # API client configuration
│   │   ├── websocket-manager.ts # WebSocket management
│   │   ├── utils.ts             # General utilities
│   │   ├── validations.ts       # Zod schemas
│   │   ├── constants.ts         # App constants
│   │   └── auth.ts              # Authentication utilities
│   │
│   ├── stores/                   # Zustand stores
│   │   ├── app-store.ts         # Global app state
│   │   ├── workflow-store.ts    # Workflow management
│   │   └── content-store.ts     # Content management
│   │
│   ├── hooks/                    # Custom React hooks
│   │   ├── use-api.ts           # API integration hooks
│   │   ├── use-websocket.ts     # WebSocket hooks
│   │   ├── use-local-storage.ts # Local storage utilities
│   │   └── use-toast.ts         # Toast notifications
│   │
│   └── types/                    # TypeScript type definitions
│       ├── api.ts               # API response types
│       ├── workflow.ts          # Workflow-related types
│       ├── content.ts           # Content types
│       └── common.ts            # Shared types
│
├── public/                       # Static assets
│   ├── icons/                   # App icons
│   ├── images/                  # Images and illustrations
│   └── manifest.json            # PWA manifest
│
├── docs/                        # Documentation
│   ├── components.md           # Component documentation
│   ├── api-integration.md      # API integration guide
│   └── deployment.md           # Deployment instructions
│
├── __tests__/                   # Test files
│   ├── components/             # Component tests
│   ├── hooks/                  # Hook tests
│   ├── pages/                  # Page tests
│   └── utils/                  # Utility tests
│
├── .env.local                   # Environment variables
├── .env.example                # Environment template
├── tailwind.config.js          # Tailwind configuration
├── next.config.js              # Next.js configuration
├── tsconfig.json               # TypeScript configuration
├── package.json                # Dependencies
└── README.md                   # Project documentation
```

## UI/UX Design Principles

### Design Philosophy
- **Clarity First**: Clear information hierarchy and intuitive navigation
- **Progress Transparency**: Always show users what's happening and how long it will take
- **Responsive Design**: Mobile-first approach with progressive enhancement
- **Accessibility**: WCAG 2.1 AA compliance built-in from the start
- **Performance**: Fast loading times and smooth interactions

### Interaction Patterns

#### Dashboard Layout
- **Primary Navigation**: Fixed sidebar with collapsible sections
- **Content Area**: Main workspace with breadcrumb navigation
- **Action Bar**: Context-sensitive actions for current page
- **Status Indicators**: Real-time system status and notifications

#### Workflow Creation Flow
1. **Topic Selection**: Search or browse educational topics
2. **Configuration**: Audience, type, duration, objectives
3. **Preview**: Review configuration before starting
4. **Progress**: Real-time generation with step-by-step feedback
5. **Results**: Content preview with download and sharing options

#### Content Management
- **Library View**: Grid/list toggle with filtering and search
- **Preview Modal**: Quick content preview without navigation
- **Bulk Actions**: Multi-select for batch operations
- **Version Control**: Track content revisions and changes

### Accessibility Requirements

#### Keyboard Navigation
- Full keyboard accessibility for all interactive elements
- Logical tab order throughout the application
- Escape key support for closing modals and menus
- Arrow key navigation for lists and grids

#### Screen Reader Support
- Semantic HTML structure with proper heading hierarchy
- ARIA labels for complex interactive elements
- Live regions for dynamic content updates
- Form labels and error message associations

#### Visual Accessibility
- High contrast color combinations (WCAG AA)
- Text scaling support up to 200%
- Focus indicators with sufficient contrast
- No reliance on color alone for information

#### Motion and Animation
- Respect prefers-reduced-motion for users with vestibular disorders
- Provide controls for auto-playing content
- Use animation purposefully to enhance understanding

## Performance Optimization

### Code Splitting
- Route-based code splitting with Next.js dynamic imports
- Component-level lazy loading for heavy components
- Separate bundles for development tools and analytics

### Image Optimization
- Next.js Image component with automatic WebP conversion
- Responsive images with multiple sizes
- Lazy loading for images below the fold
- Optimized icons using SVG or icon fonts

### Caching Strategy
- React Query for API response caching
- Next.js static generation for content pages
- Service worker for offline functionality
- Browser caching for static assets

### Bundle Optimization
- Tree shaking for unused code elimination
- Minification and compression in production
- Critical CSS inlining for above-the-fold content
- Preloading of critical resources

## Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2)
- [ ] Set up Next.js 14 project with TypeScript
- [ ] Configure Tailwind CSS and shadcn/ui
- [ ] Implement basic layout components
- [ ] Set up Zustand stores and React Query
- [ ] Create API client with error handling

### Phase 2: Core Features (Weeks 3-4)
- [ ] Build workflow creation form with validation
- [ ] Implement workflow progress tracking
- [ ] Create content preview and download functionality
- [ ] Add real-time WebSocket integration
- [ ] Implement basic content management

### Phase 3: Enhanced UX (Weeks 5-6)
- [ ] Add advanced filtering and search
- [ ] Implement dark/light theme support
- [ ] Create comprehensive error handling
- [ ] Add loading states and skeleton screens
- [ ] Implement notification system

### Phase 4: Polish & Testing (Weeks 7-8)
- [ ] Comprehensive accessibility testing
- [ ] Performance optimization and monitoring
- [ ] Mobile responsiveness testing
- [ ] User acceptance testing
- [ ] Documentation and deployment guides

## Development Guidelines

### Code Standards
- **TypeScript**: Strict mode enabled with comprehensive type coverage
- **Formatting**: Prettier with consistent configuration
- **Linting**: ESLint with React and TypeScript rules
- **Testing**: Minimum 80% test coverage for critical paths
- **Documentation**: JSDoc comments for complex functions

### Git Workflow
- **Branching**: Feature branches with descriptive names
- **Commits**: Conventional commit format with clear messages
- **Reviews**: Required code reviews for all changes
- **CI/CD**: Automated testing and deployment pipelines

### Error Handling
- **Graceful Degradation**: Fallbacks for failed API calls
- **User Feedback**: Clear error messages with actionable guidance
- **Error Boundaries**: React error boundaries to prevent crashes
- **Monitoring**: Error tracking with user context

This comprehensive frontend architecture provides a solid foundation for building a modern, scalable, and user-friendly educational content generation application. The design emphasizes real-time feedback, professional UI/UX, and maintainable code structure that will support future growth and feature additions.