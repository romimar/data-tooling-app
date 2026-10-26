require('dotenv').config();
const express = require('express');
const cors = require('cors');
const headers = {
    'User-Agent': `${process.env.EMAIL}`,
};
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

const companyTickers = process.env.COMPANY_TICKERS_JSON;
const edgarApi = process.env.EDGAR_SUBMISSIONS_API;
const docBaseUrl = process.env.DOC_BASE_URL;

const getCompanyTickersData = async (ticker) => {
    const response = await fetch(`${companyTickers}`, headers);
    if (!response.ok) {
        throw new Error('Failed to fetch Company Tickers data');
    }

	const data = await response.json();

	for (const company in data) {
		if (data[company]['ticker'] === ticker) {
			const cik = String(data[company]['cik_str']).padStart(10, '0');
			return cik;
		}
	}

    return `${ticker} not found in SEC database`;
};

const getRecentFilings = (recentFilings, cik) => {
	let filings = [];
	for (let i = 0; i < recentFilings['accessionNumber'].length; i++) {
		filings.push({
			accessionNumber: recentFilings['accessionNumber'][i],
			form: recentFilings['form'][i],
			filingDate: recentFilings['filingDate'][i],
			primaryDocument: recentFilings['primaryDocument'][i],
			documentUrl: `${docBaseUrl}${cik}/${recentFilings['accessionNumber'][i].replace(/-/g, '')}/${recentFilings['primaryDocument'][i]}`
		});
	}
	return filings;
};

const filterRecentFilings = (filings, formType) => {
	return filings.filter(filing => filing.form === formType);
};

const formTypeReducer = (filings) => {
	const summary = {};
	for (const filing of filings) {
		if (!summary[filing.form]) {
			summary[filing.form] = 0;
		}
		summary[filing.form]++;
	}
	return summary;
};

const getAllTickers = async () => {
   const response = await fetch(`${companyTickers}`, { headers });
   if (!response.ok) {
       throw new Error('Failed to fetch Company Tickers data');
   }
   const data = await response.json();
   return Object.values(data).map(company => company.ticker);
};

app.get('/api/companies/:ticker/filings', async (req, res) => {
    const { ticker } = req.params;
    try {
        const cik = await getCompanyTickersData(ticker);

		const response = await fetch(`${edgarApi}/CIK${cik}.json`, { headers });
		
		if (!response.ok) {
			throw new Error('Failed to fetch EDGAR submissions data');
		}
		const edgarData = await response.json();

		const recentFilings = getRecentFilings(edgarData['filings']['recent'], cik);
		
		return res.json(recentFilings);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/companies/:ticker/filings/:formType', async (req, res) => {
    const { ticker, formType } = req.params;
    try {
        const cik = await getCompanyTickersData(ticker);

		const response = await fetch(`${edgarApi}/CIK${cik}.json`, { headers });
		if (!response.ok) {
			throw new Error('Failed to fetch EDGAR submissions data');
		}
		const edgarData = await response.json();
		const recentFilings = getRecentFilings(edgarData['filings']['recent'], cik);

		return res.json(filterRecentFilings(recentFilings, formType));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/companies/:ticker/forms', async (req, res) => {
    const { ticker } = req.params;
    try {
        const cik = await getCompanyTickersData(ticker);
        const response = await fetch(`${edgarApi}/CIK${cik}.json`, { headers });
        if (!response.ok) {
            throw new Error('Failed to fetch EDGAR submissions data');
        }
        const edgarData = await response.json();
        const recentFilings = getRecentFilings(edgarData['filings']['recent'], cik);
        const formTypes = Array.from(new Set(recentFilings.map(f => f.form)));
        return res.json({ formTypes });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/companies/filings/summary', async (req, res) => {
    try {
        const { ticker } = req.query;
		const isTickerArray = Array.isArray(ticker);
		if (!isTickerArray || ticker.length < 1) {
			throw new Error('Ticker must be an array with at least one element');
		}

		const summary = {};
		for (const t of ticker) {
			const cik = await getCompanyTickersData(t);
			const response = await fetch(`${edgarApi}/CIK${cik}.json`, { headers });
			if (!response.ok) {
				throw new Error('Failed to fetch EDGAR submissions data');
			}
			const edgarData = await response.json();
			const recentFilings = getRecentFilings(edgarData['filings']['recent']);
			if (!filings) {
				var filings = [];
			}
			filings = filings.concat(recentFilings);
			filings = filings.filter(f => {
				const date = new Date(f.filingDate);
				const today = new Date();
				return date >= new Date(today.getFullYear()-1, today.getMonth(), today.getDate());
			});

			const filingSummary = {};
			filingSummary['form'] = formTypeReducer(filings);
			
			let tenKs = filings.filter(f => f.form === '10-K');
			tenKs = tenKs.sort((a, b) => new Date(b.filingDate) - new Date(a.filingDate));

			const latestDate = tenKs.length > 0 ? tenKs[0].filingDate : null;
			filingSummary['mostRecent10K'] = latestDate;
			
			summary[t] = filingSummary;
		}

		return res.json({ summary });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/tickers', async (req, res) => {
    try {
        const tickers = await getAllTickers();
        res.json({ tickers });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
	console.log(`Server running on http://localhost:${PORT}`);
});
