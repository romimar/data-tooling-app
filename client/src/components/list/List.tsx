import { useState, useEffect } from "react";
import axios, { AxiosError } from "axios";
import TextField from '@mui/material/TextField';
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import {
    FormControl,
    Autocomplete,
    Box,
    Chip,
    Select,
    InputLabel,
    MenuItem,
    type SelectChangeEvent,
    InputAdornment,
    IconButton
} from "@mui/material";
import Divider from '@mui/material/Divider';
import { Typography } from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
import SwapVertIcon from '@mui/icons-material/SwapVert';

import styles from './list.module.scss';

interface DataRow {
    accessionNumber: string;
    form: string;
    filingDate: string;
    primaryDocument: string;
    documentUrl: string;
}

interface FilingsSummary {
    ticker: string;
    form: Record<string, number>;
    filings: DataRow[];
    mostRecent10K: string;
}

const List = () => {
    const [ticker, setTicker] = useState("");
    const [formType, setFormType] = useState("");
    const [data, setData] = useState<DataRow[] | null>(null);
    const [filings, setFilings] = useState<FilingsSummary[] | null>(null);
    const [formTypes, setFormTypes] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingSummary, setIsLoadingSummary] = useState(false);
    const [name, setName] = useState<string[]>([]);
    const [tickers, setTickers] = useState<string[]>([]);
    const [originalData, setOriginalData] = useState<DataRow[] | null>(null);
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | null>(null);

    useEffect(() => {
        const fetchTickers = async () => {
            try {
                const response = await axios.get('/api/tickers');
                setTickers(response.data.tickers || []);
            } catch (err) {
                const error = err as AxiosError;
                console.error('Failed to fetch tickers:', error.message);
            }
        };
        fetchTickers();
    }, []);

    useEffect(() => {
        if (name.length > 0) {
            const fetchFilingsSummary = async () => {
                setIsLoadingSummary(true);
                setError(null);
                try {
                    const response = await axios.get('/api/companies/filings/summary', {
                        params: { ticker: name }
                    });
                    setFilings(response.data.summary);
                } catch (err) {
                    const error = err as AxiosError<{ error: string }>;
                    setError(error.response?.data?.error || error.message);
                    setFilings(null);
                } finally {
                    setIsLoadingSummary(false);
                }
            };
            fetchFilingsSummary();
        }
    }, [name]);

    useEffect(() => {
        if (ticker) {
            console.log(`Fetching form types for ticker: ${ticker}`);
            const fetchFormTypes = async () => {
                try {
                    const response = await axios.get(`/api/companies/${ticker}/forms`);
                    setFormTypes(response.data.formTypes || []);
                } catch (err) {
                    const error = err as AxiosError;
                    console.error('Failed to fetch form types:', error.message);
                }
            };
            fetchFormTypes();
        }
    }, [ticker]);

    const handleSearch = async () => {
        if (!ticker.trim()) {
            setError("Please enter a ticker");
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            const response = await axios.get(`/api/companies/${ticker}/filings`);
            setData(response.data);
            setOriginalData(response.data);
            setSortOrder(null)
        } catch (err) {
            const error = err as AxiosError<{ error: string }>;
            setError(error.response?.data?.error || error.message);
            setData(null);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFormChange = async (event: SelectChangeEvent) => {
        setFormType(event.target.value);
        setIsLoadingSummary(true);
        setSortOrder(null)

        try {
            const response = await axios.get(`/api/companies/${ticker}/filings/${event.target.value}`);
            setData(response.data);
            setOriginalData(response.data);
        } catch (err) {
            const error = err as AxiosError<{ error: string }>;
            setError(error.response?.data?.error || error.message);
            setData(null);
        } finally {
            setIsLoadingSummary(false);
        }
    };

    const handleSort = () => {
        if (!data || !Array.isArray(data)) return;

        if (sortOrder === null) {
            const sorted = [...data].sort((a, b) => {
                const dateA = new Date(a.filingDate);
                const dateB = new Date(b.filingDate);
                return dateA.getTime() - dateB.getTime();
            });
            setData(sorted);
            setSortOrder('asc');
            setOriginalData(data);
        } else if (sortOrder === 'asc') {
            const sorted = [...data].sort((a, b) => {
                const dateA = new Date(a.filingDate);
                const dateB = new Date(b.filingDate);
                return dateB.getTime() - dateA.getTime();
            });
            setData(sorted);
            setSortOrder('desc');
        } else {
            setData(originalData);
            setSortOrder(null);
        }
    };

    const isArrayData = Array.isArray(data);

    return (
        <>
            <div className={styles.formContainer}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                    Search for tickers to view a summary of the company filings
                </Typography>
                <FormControl sx={{ m: 1, width: 300 }}>
                    <Autocomplete
                        multiple
                        disablePortal
                        options={tickers}
                        sx={{ width: 300 }}
                        value={name}
                        style={{ width: '30rem' }}
                        onChange={(event, newValue) => setName(newValue ? newValue : [])}
                        filterOptions={(options, state) => {
                            return options.filter(o =>
                                o.toLowerCase().includes(state.inputValue.toLowerCase())
                            ).slice(0, 50);
                        }}
                        noOptionsText="No tickers found"
                        renderInput={(params) => <TextField {...params} label="Tickers" />}
                    />
                </FormControl>
            </div>
            {name && name.length > 0 && (
                <TableContainer component={Paper}>
                    <Table sx={{ minWidth: 650 }} size="small" aria-label="data table">
                        <TableHead>
                            <TableRow>
                                <TableCell align="left" style={{ fontWeight: 'bold' }}>Ticker</TableCell>
                                <TableCell align="left" style={{ fontWeight: 'bold' }}>Forms</TableCell>
                                <TableCell align="left" style={{ fontWeight: 'bold' }}>Most Recent 10K</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filings && (
                                Object.entries(filings).map(([ticker, summary]: [string, FilingsSummary]) => (
                                    <TableRow
                                        key={ticker}
                                        sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                                    >
                                        <TableCell component="th" scope="row">{ticker}</TableCell>
                                        <TableCell align="left">
                                            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                                {Object.keys(summary.form || {}).map((form: string) => (
                                                    <Chip
                                                        key={form}
                                                        label={`${form} - Count: ${summary.form[form]}`}
                                                        size="small"
                                                        variant="outlined"
                                                    />
                                                ))}
                                            </Box>
                                        </TableCell>
                                        <TableCell align="left">{summary.mostRecent10K}</TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
            <Divider variant="middle" />
            <div className={styles.formContainer}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                    Search for a ticker to view the company's filings
                </Typography>
                <Grid container spacing={1} className={styles.formGrid}>
                    <Grid>
                        <TextField
                            id="ticker"
                            label="Ticker"
                            variant="outlined"
                            style={{ width: '30rem' }}
                            value={ticker}
                            onChange={(e) => setTicker(e.target.value.toUpperCase())}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            slotProps={{
                                input: {
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            {ticker && (
                                                <IconButton
                                                    aria-label="clear"
                                                    onClick={() => {
                                                        setTicker('');
                                                        setData(null);
                                                        setFormType('');
                                                        setSortOrder(null);
                                                    }}
                                                    edge="end"
                                                    size="small"
                                                >
                                                    <ClearIcon />
                                                </IconButton>
                                            )}
                                        </InputAdornment>
                                    ),
                                },
                            }}
                        />
                    </Grid>
                    <Grid style={{ display: "flex", alignItems: "stretch" }}>
                        <Button variant="outlined" size="large" onClick={handleSearch} disabled={isLoading}>
                            {isLoading ? "Loading..." : "Send"}
                        </Button>
                    </Grid>
                    {data && (formTypes && formTypes.length > 0) && (
                        <Grid style={{ display: "flex", alignItems: "stretch" }}>
                            <FormControl>
                                <InputLabel id="form-type-label">Form Type</InputLabel>
                                <Select
                                    labelId="form-type-label"
                                    id="form-type-select"
                                    value={formType}
                                    label="Form Type"
                                    onChange={(e) => handleFormChange(e)}
                                    style={{ minWidth: '10rem' }}
                                >
                                    <MenuItem key="clear" value="">Clear</MenuItem>
                                    {formTypes.map(form => (
                                        <MenuItem key={form} value={form}>{form}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                    )}
                </Grid>
            </div>
            {error && <p style={{ color: 'var(--error)' }}>Error: {error}</p>}
            {data && (isArrayData ? data.length === 0 : Object.keys(data).length === 0) ?
                <p>No filings found.</p>
                : (
                    <TableContainer component={Paper}>
                        <Table sx={{ minWidth: 650 }} size="small" aria-label="data table">
                            <TableHead>
                                <TableRow>
                                    {Object.keys(data?.[0] || {}).map((key) => (
                                        <TableCell
                                            key={key}
                                            align="left"
                                            style={{ fontWeight: 'bold' }}>
                                            {key} {key === 'filingDate' && (
                                                <SwapVertIcon
                                                    onClick={() => handleSort()}
                                                    sx={{ cursor: 'pointer', opacity: sortOrder ? 1 : 0.35 }}
                                                />
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {data && (
                                    data.map((row: DataRow) => (
                                        <TableRow
                                            key={row.accessionNumber}
                                            sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                                        >
                                            <TableCell component="th" scope="row">{row.accessionNumber}</TableCell>
                                            <TableCell align="left">{row.form}</TableCell>
                                            <TableCell align="left">{row.filingDate}</TableCell>
                                            <TableCell align="left">{row.primaryDocument}</TableCell>
                                            <TableCell align="left">
                                                <a href={row.documentUrl} target="_blank" rel="noopener noreferrer">View Document</a>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                                {data && isLoadingSummary && (
                                    <TableRow>
                                        <TableCell colSpan={5} align="center">Loading...</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
        </>
    );
};

export default List;
