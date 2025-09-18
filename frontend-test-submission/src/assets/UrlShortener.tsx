import React, { useState } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Chip,
  Grid,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Snackbar
} from '@mui/material';
import {
  ContentCopy,
  Delete,
  Link as LinkIcon,
  Timer,
  Launch
} from '@mui/icons-material';
import { UrlRequest, ShortenedUrl } from '../types';
import { apiService } from '../services/api';
import logger from '../../../logging-middleware/src/logger';

interface UrlInputField extends UrlRequest {
  id: string;
}

const UrlShortener: React.FC = () => {
  const [urlFields, setUrlFields] = useState<UrlInputField[]>([
    { id: '1', url: '', validityMinutes: 30, customCode: '' }
  ]);
  const [shortenedUrls, setShortenedUrls] = useState<ShortenedUrl[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
    const [successMessage, setSuccessMessage] = useState<string>('');
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const addUrlField = () => {
    if (urlFields.length < 5) {
      const newField: UrlInputField = {
        id: Date.now().toString(),
        url: '',
        validityMinutes: 30,
        customCode: ''
      };
      setUrlFields([...urlFields, newField]);
      logger.logComponent('info', `Added new URL field. Total fields: ${urlFields.length + 1}`);
    }
  };

  const removeUrlField = (id: string) => {
    if (urlFields.length > 1) {
      setUrlFields(urlFields.filter(field => field.id !== id));
      logger.logComponent('info', `Removed URL field. Remaining fields: ${urlFields.length - 1}`);
    }
  };

  const updateUrlField = (id: string, field: keyof UrlRequest, value: string | number) => {
    setUrlFields(urlFields.map(urlField =>
      urlField.id === id ? { ...urlField, [field]: value } : urlField
    ));
                            {shortenedUrls.length}

  const validateUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const validateCustomCode = (code: string): boolean => {
    if (!code) return true; // Optional field
    return /^[a-zA-Z0-9]{3,20}$/.test(code);
  };

  const handleSubmit = async () => {
    await logger.logComponent('info', 'Form submission started');
    
    // Validate all fields
    const validFields = urlFields.filter(field => field.url.trim());
    
    if (validFields.length === 0) {
      setError('Please enter at least one URL');
      await logger.logComponent('warn', 'Form submission failed: No URLs provided');
      return;
    }

    // Validate URLs
    for (const field of validFields) {
      if (!validateUrl(field.url)) {
        setError(`Invalid URL format: ${field.url}`);
        await logger.logComponent('error', `Invalid URL format: ${field.url}`);
        return;
      }

      if (field.customCode && !validateCustomCode(field.customCode)) {
        setError(`Invalid custom code: ${field.customCode}. Must be 3-20 alphanumeric characters.`);
        await logger.logComponent('error', `Invalid custom code: ${field.customCode}`);
        return;
      }

      if (field.validityMinutes && (field.validityMinutes < 1 || !Number.isInteger(field.validityMinutes))) {
        setError('Validity period must be a positive integer');
        await logger.logComponent('error', `Invalid validity period: ${field.validityMinutes}`);
        return;
      }
    }

    setError('');
    setLoading(true);

    try {
      const requests: UrlRequest[] = validFields.map(field => ({
                            {shortenedUrls.length - getActiveUrlsCount()}
        validityMinutes: field.validityMinutes || 30,
        customCode: field.customCode || undefined
      }));

      const response = await apiService.shortenUrls(requests);
      
      if (response.error) {
        setError(response.error);
        await logger.logComponent('error', `API error: ${response.error}`);
      } else if (response.data) {
        setShortenedUrls([...response.data, ...shortenedUrls]);
        setSuccessMessage(`Successfully created ${response.data.length} shortened URL(s)`);
        
        // Reset form
        setUrlFields([{ id: '1', url: '', validityMinutes: 30, customCode: '' }]);
        
        await logger.logComponent('info', `Successfully created ${response.data.length} shortened URLs`);
      }
    } catch (error: any) {
      setError('Failed to shorten URLs. Please try again.');
      await logger.logComponent('error', `Unexpected error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setSuccessMessage('Copied to clipboard!');
      await logger.logComponent('info', 'URL copied to clipboard');
    } catch (error) {
      setError('Failed to copy to clipboard');
      await logger.logComponent('error', 'Failed to copy to clipboard');
    }
  };


  const formatDateTime = (dateString: string): string => {
    return new Date(dateString).toLocaleString();
  };

  const isExpired = (expiresAt: string): boolean => {
    return new Date() > new Date(expiresAt);
  };

  const getTimeRemaining = (expiresAt: string): string => {
    const now = new Date().getTime();
    const expiry = new Date(expiresAt).getTime();
    const diff = expiry - now;
    
    if (diff <= 0) return 'Expired';
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ${hours % 24}h remaining`;
    if (hours > 0) return `${hours}h ${minutes % 60}m remaining`;
    return `${minutes}m remaining`;
  };

  const openUrl = async (url: string, shortCode: string) => {
    window.open(url, '_blank');
    await apiService.recordClick(shortCode);
    await logger.logComponent('info', `Opened URL from statistics: ${shortCode}`);
  };

  const getTotalClicks = (): number => {
  return shortenedUrls.reduce((total, url) => total + url.clickCount, 0);
  };

  const getActiveUrlsCount = (): number => {
  return shortenedUrls.filter(url => !isExpired(url.expiresAt)).length;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading statistics...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, margin: '0 auto', padding: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom align="center">
        URL Statistics
      </Typography>

      {error && (
        <Alert severity="error" sx={{ marginBottom: 3 }}>
          {error}
        </Alert>
      )}

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ marginBottom: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total URLs
                  </Typography>
                  <Typography variant="h4">
                    {shortenedUrls.length}
                          {shortenedUrls.length}
                </Box>
                <LinkIcon sx={{ fontSize: 40, color: 'primary.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Active URLs
                  </Typography>
                  <Typography variant="h4" color="success.main">
                    {getActiveUrlsCount()}
                  </Typography>
                </Box>
                <Timer sx={{ fontSize: 40, color: 'success.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Clicks
                  </Typography>
                  <Typography variant="h4" color="info.main">
                    {getTotalClicks()}
                  </Typography>
                </Box>
                <Launch sx={{ fontSize: 40, color: 'info.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Expired URLs
                  </Typography>
                  <Typography variant="h4" color="error.main">
                    {shortenedUrls.length - getActiveUrlsCount()}
                          {shortenedUrls.length - getActiveUrlsCount()}
                </Box>
                <Timer sx={{ fontSize: 40, color: 'error.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* URLs Table */}
      <Paper elevation={3}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Short URL</TableCell>
                <TableCell>Original URL</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell align="center">Clicks</TableCell>
                <TableCell align="center">Created</TableCell>
                <TableCell align="center">Expires</TableCell>
                <TableCell align="center">Actions</TableCell>
                <TableCell align="center">Details</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {shortenedUrls.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Typography color="text.secondary">
                      No URLs found. Create some shortened URLs to see statistics here.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                shortenedUrls.map((url) => (
                  <React.Fragment key={url.id}>
                    <TableRow
                      sx={{
                        opacity: isExpired(url.expiresAt) ? 0.6 : 1,
                        '&:nth-of-type(odd)': {
                          backgroundColor: 'action.hover',
                        },
                      }}
                    >
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{
                            fontFamily: 'monospace',
                            color: isExpired(url.expiresAt) ? 'text.disabled' : 'primary.main',
                            fontWeight: 'bold'
                          }}
                        >
                          {url.shortCode}
                        </Typography>
                        {url.customCode && (
                          <Chip label="Custom" size="small" color="info" sx={{ mt: 0.5 }} />
                        )}
                      </TableCell>
                      
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{
                            maxWidth: 200,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            color: isExpired(url.expiresAt) ? 'text.disabled' : 'text.primary'
                          }}
                          title={url.originalUrl}
                        >
                          {url.originalUrl}
                        </Typography>
                      </TableCell>
                      
                      <TableCell align="center">
                        <Chip
                          label={isExpired(url.expiresAt) ? 'Expired' : 'Active'}
                          color={isExpired(url.expiresAt) ? 'error' : 'success'}
                          size="small"
                        />
                      </TableCell>
                      
     export default Statistics;
                        <Typography variant="body2" fontWeight="bold">
                          {url.clickCount}
                        </Typography>
                      </TableCell>
                      
                      <TableCell align="center">
                        <Typography variant="caption">
                          {formatDateTime(url.createdAt)}
                        </Typography>
                      </TableCell>
                      
                      <TableCell align="center">
                        <Typography
                          variant="caption"
                          color={isExpired(url.expiresAt) ? 'error' : 'text.secondary'}
                        >
                          {getTimeRemaining(url.expiresAt)}
                        </Typography>
                      </TableCell>
                      
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          onClick={() => openUrl(url.shortUrl, url.shortCode)}
                          disabled={isExpired(url.expiresAt)}
                          title="Open URL"
                        >
                          <Launch />
                        </IconButton>
                      </TableCell>
                      
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          onClick={() => toggleRowExpansion(url.id)}
                          title="View click details"
                        >
                          {expandedRows.has(url.id) ? <ExpandLess /> : <ExpandMore />}
                        </IconButton>
                      </TableCell>
                    </TableRow>
                    
                    {/* Expanded Row Details */}
                    <TableRow>
                      <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={8}>
                        <Collapse in={expandedRows.has(url.id)} timeout="auto" unmountOnExit>
                          <Box sx={{ margin: 2 }}>
                            <Typography variant="h6" gutterBottom component="div">
                              Click Details for {url.shortCode}
                            </Typography>
                            
                            <Grid container spacing={2} sx={{ mb: 2 }}>
                              <Grid item xs={12} md={6}>
                                <Paper sx={{ p: 2 }} variant="outlined">
                                  <Typography variant="subtitle2" gutterBottom>
                                    URL Information
                                  </Typography>
                                  <Typography variant="body2" sx={{ mb: 1 }}>
                                    <strong>Full URL:</strong> {url.originalUrl}
                                  </Typography>
                                  <Typography variant="body2" sx={{ mb: 1 }}>
                                    <strong>Short URL:</strong> {url.shortUrl}
                                  </Typography>
                                  <Typography variant="body2" sx={{ mb: 1 }}>
                                    <strong>Created:</strong> {formatDateTime(url.createdAt)}
                                  </Typography>
                                  <Typography variant="body2">
                                    <strong>Expires:</strong> {formatDateTime(url.expiresAt)}
                                  </Typography>
                                </Paper>
                              </Grid>
                              
                              <Grid item xs={12} md={6}>
                                <Paper sx={{ p: 2 }} variant="outlined">
                                  <Typography variant="subtitle2" gutterBottom>
                                    Click Statistics
                                  </Typography>
                                  <Typography variant="body2" sx={{ mb: 1 }}>
                                    <strong>Total Clicks:</strong> {url.clickCount}
                                  </Typography>
                                  <Typography variant="body2" sx={{ mb: 1 }}>
                                    <strong>Status:</strong> {isExpired(url.expiresAt) ? 'Expired' : 'Active'}
                                  </Typography>
                                  <Typography variant="body2">
                                    <strong>Time Remaining:</strong> {getTimeRemaining(url.expiresAt)}
                                  </Typography>
                                </Paper>
                              </Grid>
                            </Grid>
                            
                            {url.clicks.length > 0 ? (
                              <TableContainer component={Paper} variant="outlined">
                                <Table size="small">
                                  <TableHead>
                                    <TableRow>
                                      <TableCell>Timestamp</TableCell>
                                      <TableCell>Source</TableCell>
                                      <TableCell>User Agent</TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {url.clicks
                                      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                                      .slice(0, 10) // Show only last 10 clicks
                                      .map((click) => (
                                        <TableRow key={click.id}>
                                          <TableCell>
                                            <Typography variant="caption">
                                              {formatDateTime(click.timestamp)}
                                            </Typography>
                                          </TableCell>
                                          <TableCell>
                                            <Typography variant="caption">
                                              {click.source}
                                            </Typography>
                                          </TableCell>
                                          <TableCell>
                                            <Typography
                                              variant="caption"
                                              sx={{
                                                maxWidth: 300,
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                                display: 'block'
                                              }}
                                              title={click.location}
                                            >
                                              {click.location}
                                            </Typography>
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                  </TableBody>
                                </Table>
                              </TableContainer>
                            ) : (
                              <Alert severity="info">
                                No clicks recorded for this URL yet.
                              </Alert>
                            )}
                            
                            {url.clicks.length > 10 && (
                              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                Showing last 10 clicks out of {url.clicks.length} total clicks.
                              </Typography>
                            )}
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};










export default UrlShortener;