# RLGenes - Genetic Data Personalization Tool

Automate the personalization of genetic data explanation templates.

## Features

- Upload HTML templates from Google Docs
- Parse genetic data files (23andMe, Ancestry, SelfDecode)
- Automatically annotate SNPs with visual indicators:
  - ☁️ **Homozygous** (red, bold)
  - ☁ **Heterozygous** (dark goldenrod yellow)
  - **Wild** (black)
- Generate comprehensive reports with Grand Summary
- Download personalized HTML reports

## Local Development

### Prerequisites

- Node.js 20.19+ or 22.12+
- npm

### Installation

```bash
npm install
```

### Development Server

```bash
npm run dev
```

### Run Tests

```bash
npm test
```

### Build for Production

```bash
npm run build
```

## GitHub Pages Deployment

This project is configured for automatic deployment to GitHub Pages.

### Setup

1. **Enable GitHub Pages in Repository Settings:**
   - Go to your repository on GitHub
   - Navigate to **Settings** → **Pages**
   - Under "Build and deployment":
     - Source: **GitHub Actions**

2. **Push to Main Branch:**
   - The GitHub Actions workflow will automatically build and deploy on every push to `main`
   - View the deployment status in the **Actions** tab

3. **Access Your Site:**
   - Your site will be available at: `https://[your-username].github.io/rlgenes/`

### Manual Deployment

If you need to manually trigger a deployment:

1. Go to the **Actions** tab in your repository
2. Select the "Deploy to GitHub Pages" workflow
3. Click "Run workflow"

## Project Structure

```
rlgenes/
├── src/
│   ├── components/     # React components
│   ├── utils/          # Utility functions
│   └── types.ts        # TypeScript type definitions
├── public/             # Static assets and example files
├── .github/
│   └── workflows/
│       └── deploy.yml  # GitHub Actions deployment workflow
└── dist/               # Build output (generated)
```

## Usage

1. **Upload Template:** Choose an HTML file exported from Google Docs
2. **Upload Genetic Data:** Select your raw genetic data file
3. **Generate Report:** Click the generate button to create a personalized report
4. **Download:** Save the generated HTML report with Grand Summary

## Technologies

- React 19
- TypeScript
- Vite
- DOMPurify
- Vitest

## License

MIT

