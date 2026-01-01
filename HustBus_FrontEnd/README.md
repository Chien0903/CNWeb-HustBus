# HustBus Frontend

Ứng dụng Frontend cho hệ thống HustBus, được xây dựng với React, TypeScript, Vite và TailwindCSS.

## Mục lục

- [Công nghệ sử dụng](#công-nghệ-sử-dụng)
- [Cấu trúc thư mục](#cấu-trúc-thư-mục)
- [Cài đặt](#cài-đặt)
- [Chạy ứng dụng](#chạy-ứng-dụng)
- [Scripts](#scripts)
- [Tính năng chính](#tính-năng-chính)
- [Cấu hình](#cấu-hình)
- [Hướng dẫn phát triển](#hướng-dẫn-phát-triển)

## Công nghệ sử dụng

### Core Technologies
- **React 19.2.0** - Thư viện UI với React Compiler được kích hoạt
- **TypeScript 5.9.3** - Type-safe JavaScript
- **Vite 7.2.4** - Build tool và dev server nhanh

### Styling & UI
- **TailwindCSS 4.1.17** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **Lucide React** - Icon library
- **class-variance-authority** - Quản lý variants cho components
- **tailwind-merge** - Merge Tailwind classes hiệu quả

### Routing & Navigation
- **React Router DOM 7.9.6** - Client-side routing

### Internationalization (i18n)
- **i18next 25.6.3** - Framework i18n
- **react-i18next 16.3.5** - React integration cho i18next
- **i18next-browser-languagedetector** - Tự động phát hiện ngôn ngữ
- **i18next-http-backend** - Load translations từ backend
- **Ngôn ngữ hỗ trợ**: English (en), Vietnamese (vi), Japanese (ja)

### Development Tools
- **ESLint** - Linting
- **React Compiler** - Tối ưu hóa performance tự động

## Cấu trúc thư mục

```
frontend/
├── public/
│   └── locales/          # Translation files
│       ├── en/
│       ├── ja/
│       └── vi/
├── src/
│   ├── assets/           # Static assets (images, fonts, etc.)
│   ├── components/       # Reusable components
│   │   ├── ui/           # UI components (button, input, etc.)
│   │   └── LanguageSwitcher.tsx
│   ├── layouts/          # Layout components
│   │   ├── AuthLayout.tsx    # Layout cho auth pages
│   │   └── MainLayout.tsx    # Layout chính
│   ├── lib/              # Utility libraries
│   │   └── utils.ts      # Helper functions
│   ├── pages/            # Page components
│   │   └── HomePage.tsx
│   ├── App.tsx           # Root component với routing
│   ├── App.css           # Global styles
│   ├── i18n.ts           # i18n configuration
│   ├── index.css         # Tailwind imports
│   └── main.tsx          # Entry point
├── eslint.config.js      # ESLint configuration
├── package.json
├── tsconfig.json         # TypeScript configuration
├── vite.config.ts        # Vite configuration
└── README.md
```

## Cài đặt

### Yêu cầu
- Node.js >= 18.x
- pnpm

### Các bước cài đặt

1. Clone repository:
```bash
git clone <repository-url>
```

2. Cài đặt dependencies:
```bash
pnpm install
```

## Chạy ứng dụng

### Development mode
```bash
pnpm dev
```
Ứng dụng sẽ chạy tại `http://localhost:5173` (default Vite port)

### Production build
```bash
pnpm build
```
Build output sẽ được tạo trong thư mục `dist/`

### Preview production build
```bash
pnpm preview
```

### Linting
```bash
pnpm lint
```

## Scripts

| Script | Mô tả |
|--------|-------|
| `pnpm dev` | Chạy development server với HMR |
| `pnpm build` | Build production app (TypeScript check + Vite build) |
| `pnpm lint` | Chạy ESLint để check code quality |
| `pnpm preview` | Preview production build locally |

## Tính năng chính

### Người dùng (User)
- Tìm kiếm tuyến xe buýt
- Xem chi tiết tuyến và lịch trình
- Hỗ trợ đa ngôn ngữ (Tiếng Việt, Tiếng Anh, Tiếng Nhật)

### Quản trị (Admin)
- **Quản lý tuyến xe (Bus Route Management)**:
  - Truy cập tại: `/admin/bus-lines`
  - Xem danh sách tất cả các tuyến
  - **Thêm mới**: Tạo tuyến xe mới với các thông tin chi tiết
  - **Chỉnh sửa**: Cập nhật thông tin tuyến xe
  - **Xóa**: Xóa tuyến xe khỏi hệ thống

## Cấu hình

### Path Aliases
Vite được cấu hình với path alias `@` trỏ đến `src/`:
```typescript
import Component from '@/components/Component'
import { utils } from '@/lib/utils'
```

### TailwindCSS
- TailwindCSS 4.x được tích hợp qua Vite plugin
- Configuration trong `vite.config.ts`
- Import base styles trong `src/index.css`

### TypeScript
- Strict mode được bật
- Separate configs cho app (`tsconfig.app.json`) và build tools (`tsconfig.node.json`)

### i18n Configuration
File `src/i18n.ts` cấu hình:
- Fallback language: English
- Supported languages: en, vi, ja
- Auto language detection
- HTTP backend để load translations

## Hướng dẫn phát triển

### Tạo Component mới

1. **UI Component** (trong `components/ui/`):
```tsx
// components/ui/card.tsx
import { cn } from '@/lib/utils'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  // props
}

export function Card({ className, ...props }: CardProps) {
  return (
    <div className={cn("rounded-lg border p-4", className)} {...props} />
  )
}
```

2. **Page Component** (trong `pages/`):
```tsx
// pages/NewPage.tsx
export default function NewPage() {
  return (
    <div>
      <h1>New Page</h1>
    </div>
  )
}
```

3. **Thêm route mới** trong `App.tsx`:
```tsx
<Route element={<MainLayout />}>
  <Route path="/new-page" element={<NewPage />} />
</Route>
```


### Best Practices

1. **Component Organization**:
   - Tách UI components (reusable) vào `components/ui/`
   - Tách feature components vào `components/`
   - Mỗi page có component riêng trong `pages/`

2. **Styling**:
   - Ưu tiên Tailwind utility classes
   - Dùng `cn()` helper để merge classes
   - Tạo component variants với `class-variance-authority`

3. **Type Safety**:
   - Định nghĩa interfaces cho component props
   - Sử dụng TypeScript strict mode
   - Tránh `any` type

4. **Performance**:
   - Lazy load pages với `React.lazy()` nếu cần
   - Optimize images và assets
   - Tận dụng React Compiler optimizations

### Troubleshooting

**Port đã được sử dụng**:
```bash
# Thay đổi port trong vite.config.ts
export default defineConfig({
  server: {
    port: 3000
  }
})
```
**TypeScript errors**:
```bash
# Clean và rebuild
rm -rf node_modules dist
pnpm install
pnpm build
```

## Tài liệu tham khảo

- [React Documentation](https://react.dev)
- [Vite Documentation](https://vite.dev)
- [TailwindCSS Documentation](https://tailwindcss.com)
- [React Router Documentation](https://reactrouter.com)
- [Radix UI Documentation](https://www.radix-ui.com)

## License

Copyright © 2025 HustBus
