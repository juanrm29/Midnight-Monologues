# The Semantic IDE - Personal Portfolio & Blog

> **Integrated Destiny Environment**: Hidupmu adalah source code. Website ini adalah Text Editor untuk jiwamu.

## 🎨 Konsep

Website ini menggabungkan konsep IDE (Integrated Development Environment) dengan personal portfolio dan blog. Setiap elemen naratif diwarnai seperti syntax highlighting di code editor, menciptakan pengalaman unik yang memadukan storytelling dengan teknologi.

## ✨ Fitur Utama

### 1. **Semantic Syntax Highlighting**
- **Variable (Biru)**: Tokoh atau subjek utama
- **Function (Kuning)**: Tindakan atau kata kerja krusial
- **String (Hijau)**: Kutipan langsung dan dialog
- **Comment (Abu-abu)**: Meta-commentary dan pemikiran pribadi

### 2. **Living Margin**
Sidebar kanan yang berubah konten secara dinamis berdasarkan bagian yang sedang dibaca.

### 3. **Variable Hover**
Hover pada kata-kata tertentu untuk melihat definisi personal dalam format seperti dokumentasi fungsi.

### 4. **Narrative Console**
Footer hitam seperti terminal yang mencatat aktivitas user secara naratif real-time.

### 5. **Refactor Toggle**
Tombol untuk beralih antara:
- **View Render**: Tampilan naratif yang indah
- **View Source**: Tampilan data mentah dalam format JSON/bullet points

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Animation**: Framer Motion
- **State Management**: Zustand
- **Typography**: JetBrains Mono (monospace) + Inter (sans-serif)

## 🚀 Getting Started

### Prerequisites
- Node.js 18.17 or later
- npm, yarn, pnpm, or bun

### Installation

```bash
# Install dependencies
npm install
# or
yarn install
# or
pnpm install
```

### Development

```bash
# Run development server
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the result.

### Build for Production

```bash
# Build the project
npm run build

# Start production server
npm start
```

## 📁 Project Structure

```
├── app/
│   ├── layout.tsx          # Root layout with fonts
│   ├── page.tsx            # Main page with all content
│   └── globals.css         # Global styles and utilities
├── components/
│   ├── Editor.tsx          # Main content area (70%)
│   ├── Inspector.tsx       # Living margin sidebar (30%)
│   ├── NarrativeConsole.tsx # Bottom console
│   ├── RefactorToggle.tsx  # View mode toggle button
│   ├── SyntaxHighlight.tsx # Syntax highlighting component
│   └── VariableHover.tsx   # Hover tooltip component
├── lib/
│   └── store.ts            # Zustand state management
└── tailwind.config.ts      # Custom colors and fonts
```

## 🎨 Customization

### Colors
Edit `tailwind.config.ts` to customize syntax colors:
- `variable`: Blue (#2e86de)
- `function`: Yellow Gold (#f1c40f)
- `string`: Green (#27ae60)
- `comment`: Gray (#95a5a6)

### Content
Edit `app/page.tsx` to add your own:
- Stories and fiction
- Portfolio projects
- Personal philosophy

### Living Margin Data
Edit `components/Inspector.tsx` to customize sidebar content for each section.

## 💡 Usage Tips

1. **Adding New Sections**: Use `data-section="your-section"` attribute on section elements
2. **Syntax Highlighting**: Wrap text with `<SyntaxHighlight type="variable|function|string|comment">`
3. **Variable Hover**: Wrap words with `<VariableHover word="..." definition="...">`
4. **Console Activities**: Use `addActivity()` from store to log user actions

## 📝 License

This project is created by Juan Rizky Maulana.

---

**Philosophy**: _"Life is source code. Stories are compiled narratives."_

Runtime: Juan Rizky Maulana | Version: 2026.01 | Status: Active
