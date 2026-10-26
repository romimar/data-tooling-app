# Data Tooling App

A modern web application for searching and viewing SEC EDGAR filings by company ticker.

## Features

- Multi-select ticker search for viewing company filing summaries
- Single ticker search for detailed filing information
- Filter filings by form type
- Sort filings by date

## Tech Stack

- Frontend: React 19 with TypeScript
- UI Framework: Material-UI (MUI)
- HTTP Client: Axios
- Build Tool: Vite
- Styling: SASS
- Backend: Node.js - Express.js

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/romimar/data-tooling-app.git
cd data-tooling-app
```

2. **Install backend dependencies**

```bash
cd server
npm install
```

3. **Install frontend dependencies**

```bash
cd ../client
npm install
```

### Running the Application

**Terminal 1 - Backend:**

```bash
cd server
npm run dev
```

Server runs at `http://localhost:3000`

**Terminal 2 - Frontend:**

```bash
cd client
npm run dev
```

The app will open at `http://localhost:5173` (or the port shown in your terminal)

## Environment Variables

The server requires the following environment variables (see `server/.env`):

| Variable                | Description                         | Default                                          |
| ----------------------- | ----------------------------------- | ------------------------------------------------ |
| `PORT`                  | Server port                         | `3000`                                           |
| `NODE_ENV`              | Node environment                    | `development`                                    |
| `EMAIL`                 | Contact email                       | `YOUR_EMAIL`                                     |
| `COMPANY_TICKERS_JSON`  | SEC company tickers JSON URL        | `https://www.sec.gov/files/company_tickers.json` |
| `EDGAR_SUBMISSIONS_API` | SEC EDGAR submissions API base URL  | `https://data.sec.gov/submissions/`              |
| `DOC_BASE_URL`          | SEC EDGAR document archive base URL | `https://www.sec.gov/Archives/edgar/data/`       |

## Project Structure

- `src/components/list/` - Main filing search and display component
- `src/components/` - Reusable UI components
- `src/` - Core application files

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint

## How to Use

### Viewing Summary

1. Select one or more tickers from the "Tickers" multi-select dropdown
2. View the company filing summary in the table below

### Searching by Ticker

1. Enter a ticker in the text input
2. Click "Send" or press Enter
3. View all filings for that company

### Filtering Filings

1. After searching, select a form type from the "Filter Form" dropdown
2. The table will show only filings of that type

### Sorting Filings

1. Click the sort icon next to "filingDate" in the table header
2. First click sorts by date (ascending - oldest first)
3. Second click reverses the sort (descending - newest first)
4. Third click returns to original unsorted order

## API Integration

The app connects to SEC EDGAR API endpoints for retrieving:

- Company ticker information
- Recent filing data
- Filing submissions by form type

## Notes

- Form type filtering only appears after a successful search
- The multi-select summary view and single-ticker search view are separate features
- Clearing the ticker input automatically clears the results table
