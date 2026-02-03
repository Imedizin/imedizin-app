# Frontend Coding Standards

This document defines the coding standards and conventions for the React frontend.

## Architecture Overview

```
src/
├── api/                    # API Layer
│   ├── client.ts           # Shared HTTP client & error handling
│   ├── domains.ts          # Domain API functions
│   ├── mailboxes.ts        # Mailbox API functions
│   └── emails.ts           # Email API functions
│
├── types/                  # Shared Type Definitions
│   ├── api.ts              # Generic API response types
│   ├── domain.ts           # Domain entity types
│   ├── mailbox.ts          # Mailbox entity types
│   └── email.ts            # Email entity types
│
├── components/             # Reusable Components
│   ├── ui/                 # shadcn/ui components (auto-generated)
│   ├── forms/              # Form components
│   └── dashboard/          # Dashboard-specific components
│
├── pages/                  # Page Components
│   ├── Index.tsx           # Home page
│   ├── Domains.tsx         # Domains management page
│   └── ...
│
├── hooks/                  # Custom React Hooks
│   ├── useTheme.ts         # Theme management
│   └── useNotifications.tsx # Real-time notifications
│
├── theme/                  # Theme Configuration
│   ├── constants.ts        # Theme constants (colors, etc.)
│   └── ThemeProvider.tsx   # Theme context provider
│
└── lib/                    # Utilities
    └── utils.ts            # General utility functions
```

## File Naming Conventions

| Type             | Convention                  | Example                               |
| ---------------- | --------------------------- | ------------------------------------- |
| React Components | PascalCase                  | `DomainForm.tsx`, `Domains.tsx`       |
| Hooks            | camelCase with `use` prefix | `useTheme.ts`, `useNotifications.tsx` |
| API Services     | camelCase (plural noun)     | `domains.ts`, `mailboxes.ts`          |
| Type Files       | camelCase (singular noun)   | `domain.ts`, `mailbox.ts`             |
| Utilities        | camelCase                   | `utils.ts`, `client.ts`               |

### File Extensions

- `.tsx` - Components and hooks that return JSX
- `.ts` - Pure TypeScript (types, utilities, API functions)

---

## API Layer Standards

### Shared Client

All API files MUST use the shared client from `api/client.ts`:

```typescript
// api/domains.ts
import { apiClient, extractErrorMessage } from "./client";
import type { Domain, CreateDomainDto } from "@/types/domain";
```

### API Function Pattern

```typescript
/**
 * Fetch all domains
 */
export async function getDomains(): Promise<Domain[]> {
  try {
    const result = await apiClient.get("domains").json<{ data: Domain[] }>();
    return result.data;
  } catch (error) {
    if (error instanceof HTTPError) {
      const message = await extractErrorMessage(error, "Failed to fetch domains");
      throw new Error(message);
    }
    throw error;
  }
}
```

### Function Naming

| Operation | Naming Pattern                    | Example                  |
| --------- | --------------------------------- | ------------------------ |
| Fetch all | `get<Entity>s`                    | `getDomains()`           |
| Fetch one | `get<Entity>`                     | `getDomain(id)`          |
| Create    | `add<Entity>` or `create<Entity>` | `addDomain(data)`        |
| Update    | `update<Entity>`                  | `updateDomain(id, data)` |
| Delete    | `delete<Entity>`                  | `deleteDomain(id)`       |
| Search    | `search<Entity>s`                 | `searchEmails(query)`    |

---

## Type Definitions

### Entity Types

Define entity types in `types/<entity>.ts`:

```typescript
// types/domain.ts
export interface Domain {
  id: string;
  domain: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDomainDto {
  domain: string;
  name: string;
}

export interface UpdateDomainDto {
  domain?: string;
  name?: string;
}
```

### API Response Types

Generic response types go in `types/api.ts`:

```typescript
// types/api.ts
export interface ApiResponse<T> {
  data: T;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
```

### Type Imports

Always use type imports when importing only types:

```typescript
import type { Domain, CreateDomainDto } from "@/types/domain";
```

---

## Component Standards

### Page Components

Page components live in `pages/` and follow this structure:

```typescript
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
// ... component imports

const DomainsPage: React.FC = () => {
  // 1. Hooks (form, query client, state)
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // 2. Queries
  const { data: domains = [], isLoading, error } = useQuery({
    queryKey: ["domains"],
    queryFn: getDomains,
  });

  // 3. Mutations
  const addMutation = useMutation({
    mutationFn: addDomain,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["domains"] });
      message.success("Domain added successfully");
    },
  });

  // 4. Event handlers
  const handleSubmit = (values: DomainFormData) => {
    addMutation.mutate(values);
  };

  // 5. Render
  return (
    // JSX
  );
};

export default DomainsPage;
```

### Form Components

Forms live in `components/forms/` and receive form instance as prop:

```typescript
// components/forms/DomainForm.tsx
import React from "react";
import { Form, Input } from "antd";
import type { FormInstance } from "antd";

interface DomainFormProps {
  form: FormInstance;
  initialValues?: DomainFormData;
  onSubmit: (values: DomainFormData) => void;
}

const DomainForm: React.FC<DomainFormProps> = ({ form, initialValues, onSubmit }) => {
  return (
    <Form form={form} layout="vertical" onFinish={onSubmit} initialValues={initialValues}>
      {/* Form fields */}
    </Form>
  );
};

export default DomainForm;
```

---

## State Management

### Server State (TanStack Query)

Use TanStack Query for all server state:

```typescript
// Queries (reading data)
const { data, isLoading, error } = useQuery({
  queryKey: ["domains"],
  queryFn: getDomains,
});

// Mutations (writing data)
const mutation = useMutation({
  mutationFn: addDomain,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["domains"] });
  },
});
```

### Query Keys

Use consistent query keys:

| Pattern       | Example                           |
| ------------- | --------------------------------- |
| List all      | `["domains"]`                     |
| Single item   | `["domains", id]`                 |
| Filtered list | `["emails", { mailboxId, page }]` |
| Search        | `["emails", "search", query]`     |

### Local UI State

Use `useState` for local UI state only:

```typescript
const [drawerOpen, setDrawerOpen] = useState(false);
const [editingItem, setEditingItem] = useState<Domain | null>(null);
```

---

## Error Handling

### API Errors

Always use `extractErrorMessage` for consistent error extraction:

```typescript
try {
  const result = await apiClient.post("domains", { json: data }).json();
  return result.data;
} catch (error) {
  if (error instanceof HTTPError) {
    const message = await extractErrorMessage(error, "Failed to create domain");
    throw new Error(message);
  }
  throw error;
}
```

### UI Error Display

Use Ant Design's `message` for user feedback:

```typescript
// Success
message.success("Domain added successfully");

// Error (in mutation onError)
onError: (error: Error) => {
  message.error(error.message || "Failed to add domain");
}
```

---

## Styling Guidelines

### Prefer Tailwind/CSS Classes

Use Tailwind utility classes or CSS modules over inline styles:

```typescript
// Preferred
<div className="mb-6 flex justify-between items-center">

// Avoid
<div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between' }}>
```

### Theme Constants

Use theme constants for brand colors:

```typescript
import { primaryColor } from "@/theme/constants";

<Button type="primary" style={{ backgroundColor: primaryColor }}>
```

### Component Library

- **Ant Design** - Primary UI component library (Table, Form, Modal, etc.)
- **shadcn/ui** - Secondary components in `components/ui/`

---

## Import Organization

Order imports as follows:

1. React and third-party libraries
2. Internal components (using `@/` alias)
3. Internal utilities and types
4. Styles (if any)

```typescript
// 1. React & third-party
import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Table, Button, Modal } from "antd";

// 2. Internal components
import DomainForm from "@/components/forms/DomainForm";
import { primaryColor } from "@/theme/constants";

// 3. Internal utilities & types
import { getDomains, addDomain } from "@/api/domains";
import type { Domain, CreateDomainDto } from "@/types/domain";
```

---

## Testing

### Test File Location

Place tests in `src/test/` or colocated with the file:

- Unit tests: `Component.test.tsx`
- Integration tests: `test/integration/`

### Testing Patterns

```typescript
import { render, screen } from "@testing-library/react";
import DomainForm from "./DomainForm";

describe("DomainForm", () => {
  it("should render form fields", () => {
    render(<DomainForm form={mockForm} onSubmit={jest.fn()} />);
    expect(screen.getByLabelText("Domain Name")).toBeInTheDocument();
  });
});
```

---

## Best Practices

1. **Type everything** - Use TypeScript types for all props, state, and function parameters
2. **Keep components focused** - One component = one responsibility
3. **Extract reusable logic** - Create custom hooks for shared logic
4. **Handle loading states** - Always show loading indicators
5. **Handle errors gracefully** - Display user-friendly error messages
6. **Use early returns** - Return early for error/loading states
7. **Avoid prop drilling** - Use context or composition for deep data passing
