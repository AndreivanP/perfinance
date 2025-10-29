import React, { useEffect, useState, useMemo } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Button, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  CircularProgress,
  Alert,
  TablePagination,
  IconButton,
  Tooltip,
  Grid,
  Card,
  CardContent,
  useTheme,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
import { getAuthToken } from '../api/auth';
import { fetchAssetControls, fetchCurrentTotal } from '../api/assetControl';
import type { AssetControl, CurrentTotal } from '../api/assetControl';
import RefreshIcon from '@mui/icons-material/Refresh';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import TableChartIcon from '@mui/icons-material/TableChart';
import { formatCurrency, formatDate } from '../utils/formatters';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';

const DashboardPage: React.FC = () => {
  const [assetControls, setAssetControls] = useState<AssetControl[]>([]);
  const [currentTotal, setCurrentTotal] = useState<CurrentTotal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');
  const theme = useTheme();

  const loadAssetControls = async () => {
    setLoading(true);
    setError(null);

    try {
      // Get username from token (you might want to store it in auth context)
      const token = getAuthToken();
      if (!token) {
        throw new Error('Nenhum token de autenticação encontrado');
      }
      
      const username = 'Andreivan'; // In a real app, get this from user context or token
      
      // Fetch asset controls (required)
      const assetData = await fetchAssetControls(username);
      setAssetControls(assetData);
      
      // Fetch current total (optional - don't fail if this errors)
      try {
        const currentTotalData = await fetchCurrentTotal(username);
        console.log('Current Total Data:', currentTotalData);
        setCurrentTotal(currentTotalData);
      } catch (currentTotalErr) {
        console.error('Erro ao carregar o total atual:', currentTotalErr);
        // Continue without current total data
      }
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      setError('Falha ao carregar os dados. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssetControls();
  }, []);


  const handleRefresh = () => {
    loadAssetControls();
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Avoid a layout jump when reaching the last page with empty rows.
  const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - assetControls.length) : 0;

  // Prepare chart data
  const chartData = useMemo(() => {
    return assetControls.map(control => ({
      date: new Date(control.controlDate).getTime(),
      value: control.currentTotalValue,
      formattedDate: formatDate(control.controlDate),
      formattedValue: formatCurrency(control.currentTotalValue)
    }));
  }, [assetControls]);

  // Calculate total value and growth
  const { totalValue, growth } = useMemo(() => {
    if (assetControls.length === 0) return { totalValue: 0, growth: 0 };
    
    if (assetControls.length === 1) {
      return { totalValue: assetControls[0].currentTotalValue, growth: 0 };
    }
    
    const first = assetControls[0].currentTotalValue;
    const last = assetControls[assetControls.length - 1].currentTotalValue;
    const growth = ((last - first) / first) * 100;
    
    return {
      totalValue: last,
      growth: isFinite(growth) ? growth : 0
    };
  }, [assetControls]);

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Box sx={{ 
        mb: 4,
        pb: 2,
        borderBottom: '1px solid',
        borderColor: 'divider'
      }}>
        <Typography 
          variant="h4" 
          component="h1"
          sx={{ 
            fontWeight: 600, 
            mb: 0.5,
            background: 'linear-gradient(45deg, #1976d2 30%, #21CBF3 90%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            display: 'inline-block'
          }}
        >
          Painel de Controle de Ativos
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Acompanhe o crescimento financeiro ao longo do tempo
        </Typography>
      </Box>
      <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
        <Tooltip title="Atualizar dados">
          <IconButton onClick={handleRefresh} disabled={loading}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>Carregando...</Typography>
        </Box>
      ) : assetControls.length === 0 ? (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
          <Button onClick={handleRefresh} startIcon={<RefreshIcon />}>
            Tentar Novamente
          </Button>
        </Box>
      ) : (
        <>
          {/* Summary Cards */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, md: 6, lg: 4 }}>
              <Card elevation={2}>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Valor Total
                  </Typography>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                    {formatCurrency(totalValue)}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        color: growth >= 0 ? 'success.main' : 'error.main',
                        display: 'flex',
                        alignItems: 'center',
                        fontWeight: 'medium'
                      }}
                    >
                      {growth >= 0 ? '↑' : '↓'} {Math.abs(growth).toFixed(2)}% geral
                    </Typography>
                    {assetControls.length > 0 && (
                      <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                        desde {formatDate(assetControls[0].controlDate)}
                      </Typography>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, md: 6, lg: 4 }}>
              <Card elevation={2}>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Renda Variável Total
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {currentTotal && currentTotal.variable_income_total != null 
                      ? formatCurrency(currentTotal.variable_income_total) 
                      : '-'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Ativos de renda variável atuais
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, md: 6, lg: 4 }}>
              <Card elevation={2}>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Porcentagem de Renda Variável
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {currentTotal && currentTotal.variable_income_percent != null 
                      ? `${currentTotal.variable_income_percent.toFixed(2)}%` 
                      : '-'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Percentual da carteira total
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Alternar entre Gráfico/Tabela */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Desempenho dos Ativos</Typography>
            <ToggleButtonGroup
              color="primary"
              value={viewMode}
              exclusive
              onChange={(_e, newView) => newView && setViewMode(newView)}
              size="small"
            >
              <ToggleButton value="chart" aria-label="visualização de gráfico">
                <ShowChartIcon sx={{ mr: 1 }} /> Gráfico
              </ToggleButton>
              <ToggleButton value="table" aria-label="visualização de tabela">
                <TableChartIcon sx={{ mr: 1 }} /> Tabela
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {/* Main Content */}
          <Card elevation={2} sx={{ mb: 3 }}>
            {viewMode === 'chart' ? (
              <Box sx={{ p: 3, height: '500px', width: '100%' }}>
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
                  >
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.8} />
                        <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(timestamp) => {
                        const date = new Date(timestamp);
                        // Only show month and year, with reduced frequency
                        return date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
                      }}
                      tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
                      minTickGap={80}
                      interval="preserveStartEnd"
                      tickMargin={10}
                    />
                    <YAxis
                      tickFormatter={(value: number) => formatCurrency(value)}
                      tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
                      width={110}
                      tickMargin={10}
                      allowDecimals={false}
                      domain={['auto', 'auto']}
                      tickCount={8}
                    />
                    <RechartsTooltip
                      formatter={(value: number) => formatCurrency(Number(value))}
                      labelFormatter={(label) => formatDate(new Date(label))}
                      contentStyle={{
                        backgroundColor: theme.palette.background.paper,
                        borderColor: theme.palette.divider,
                        borderRadius: theme.shape.borderRadius,
                        boxShadow: theme.shadows[2],
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke={theme.palette.primary.main}
                      fillOpacity={1}
                      fill="url(#colorValue)"
                      activeDot={{ r: 8 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            ) : (
              <>
                <TableContainer sx={{ maxHeight: 'calc(100vh - 400px)' }}>
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Data</TableCell>
                        <TableCell align="right">Valor Total</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {assetControls
                        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                        .map((control) => (
                          <TableRow key={control.id} hover>
                            <TableCell>{formatDate(control.controlDate)}</TableCell>
                            <TableCell align="right">
                              {formatCurrency(control.currentTotalValue)}
                            </TableCell>
                          </TableRow>
                        ))}
                      {emptyRows > 0 && (
                        <TableRow style={{ height: 53 * emptyRows }}>
                          <TableCell colSpan={2} />
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
                <TablePagination
                  rowsPerPageOptions={[5, 10, 25]}
                  component="div"
                  count={assetControls.length}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  labelRowsPerPage="Linhas por página:"
                  labelDisplayedRows={({ from, to, count }) => 
                    `${from}-${to} de ${count !== -1 ? count : `mais de ${to}`}`
                  }
                />
              </>
            )}
          </Card>
        </>
      )}
    </Container>
  );
};

export default DashboardPage;
