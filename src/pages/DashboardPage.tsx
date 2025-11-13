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
import { fetchAssets } from '../api/assets';
import type { Asset } from '../api/assets';
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
  AreaChart,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import type { PieLabelRenderProps } from 'recharts';

const CATEGORY_LABELS: Record<Asset['category'], string> = {
  RENDA_FIXA_POS: 'Renda Fixa Pós',
  RENDA_FIXA_PRE: 'Renda Fixa Pré',
  RENDA_FIXA_IPCA: 'Renda Fixa IPCA',
  ACOES: 'Ações',
  CRIPTOMOEDAS: 'Criptomoedas',
  IMOVEIS: 'Imóveis',
  CARROS: 'Carros',
};

const CATEGORY_COLORS: Record<Asset['category'], string> = {
  RENDA_FIXA_POS: '#1976d2',
  RENDA_FIXA_PRE: '#64b5f6',
  RENDA_FIXA_IPCA: '#4caf50',
  ACOES: '#ff9800',
  CRIPTOMOEDAS: '#ab47bc',
  IMOVEIS: '#009688',
  CARROS: '#ff7043',
};

const PERFORMANCE_CATEGORIES: Array<{ key: Asset['category']; label: string }> = [
  { key: 'RENDA_FIXA_POS', label: 'Renda Fixa Pós - Variação Mensal' },
  { key: 'RENDA_FIXA_IPCA', label: 'Renda Fixa IPCA - Variação Mensal' },
  { key: 'ACOES', label: 'Ações - Variação Mensal' },
];

const formatMonthYear = (date: Date) =>
  date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });

const DashboardPage: React.FC = () => {
  const [assetControls, setAssetControls] = useState<AssetControl[]>([]);
  const [currentTotal, setCurrentTotal] = useState<CurrentTotal | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
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

      // Fetch asset controls and assets in parallel
      const [assetControlData, assetsData] = await Promise.all([
        fetchAssetControls(username),
        fetchAssets(username)
      ]);
      setAssetControls(assetControlData);
      setAssets(assetsData);
      
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

  const overallControls = useMemo(
    () => assetControls.filter((control) => !control.category),
    [assetControls]
  );

  // Prepare chart data with quarterly peaks and current month
  const chartData = useMemo(() => {
    if (!overallControls.length) {
      const currentValue = currentTotal?.current_total;
      if (!currentValue) return [];
      const now = new Date();
      now.setDate(1);
      now.setHours(0, 0, 0, 0);
      return [{
        date: now.getTime(),
        value: currentValue,
        formattedDate: formatMonthYear(now),
        formattedValue: formatCurrency(currentValue),
      }];
    }

    const quarterMap = new Map<string, { date: Date; value: number }>();

    overallControls.forEach((control) => {
      const controlDate = new Date(control.controlDate);
      if (Number.isNaN(controlDate.getTime())) return;
      const quarterMonth = Math.floor(controlDate.getMonth() / 3) * 3;
      const quarterStart = new Date(controlDate.getFullYear(), quarterMonth, 1);
      const key = `${quarterStart.getFullYear()}-${quarterStart.getMonth()}`;
      const existing = quarterMap.get(key);

      if (!existing || control.currentTotalValue > existing.value) {
        quarterMap.set(key, { date: quarterStart, value: control.currentTotalValue });
      }
    });

    const quarterlyData = Array.from(quarterMap.values())
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .map(({ date, value }) => ({
        date: date.getTime(),
        value,
        formattedDate: formatMonthYear(date),
        formattedValue: formatCurrency(value),
      }));

    const currentValue =
      currentTotal?.current_total ?? overallControls[overallControls.length - 1]?.currentTotalValue;

    if (currentValue) {
      const now = new Date();
      now.setDate(1);
      now.setHours(0, 0, 0, 0);
      const lastPoint = quarterlyData[quarterlyData.length - 1];
      const isSameMonth =
        lastPoint &&
        new Date(lastPoint.date).getFullYear() === now.getFullYear() &&
        new Date(lastPoint.date).getMonth() === now.getMonth();

      if (isSameMonth) {
        quarterlyData[quarterlyData.length - 1] = {
          date: now.getTime(),
          value: currentValue,
          formattedDate: formatMonthYear(now),
          formattedValue: formatCurrency(currentValue),
        };
      } else {
        quarterlyData.push({
          date: now.getTime(),
          value: currentValue,
          formattedDate: formatMonthYear(now),
          formattedValue: formatCurrency(currentValue),
        });
      }
    }

    return quarterlyData;
  }, [overallControls, currentTotal]);

  // Calculate total value and growth
  const { totalValue, growth } = useMemo(() => {
    if (overallControls.length === 0) {
      const fallbackTotal = currentTotal?.current_total ?? 0;
      return { totalValue: fallbackTotal, growth: 0 };
    }
    
    if (overallControls.length === 1) {
      return { totalValue: overallControls[0].currentTotalValue, growth: 0 };
    }
    
    const first = overallControls[0].currentTotalValue;
    const last = overallControls[overallControls.length - 1].currentTotalValue;
    const growth = ((last - first) / first) * 100;
    
    return {
      totalValue: last,
      growth: isFinite(growth) ? growth : 0
    };
  }, [overallControls, currentTotal]);

  const categoryDistribution = useMemo(() => {
    const totalAmount = currentTotal?.current_total ?? totalValue;
    if (!assets.length || !totalAmount || totalAmount <= 0) {
      return [];
    }

    const totals = assets.reduce<Partial<Record<Asset['category'], number>>>((acc, asset) => {
      const value = asset.current_value ?? 0;
      acc[asset.category] = (acc[asset.category] ?? 0) + value;
      return acc;
    }, {});

    return Object.entries(totals)
      .filter(([, value]) => (value ?? 0) > 0)
      .map(([category, value]) => {
        const percent = Number((((value ?? 0) / totalAmount) * 100).toFixed(2));
        return {
          category: category as Asset['category'],
          name: CATEGORY_LABELS[category as Asset['category']],
          rawValue: value ?? 0,
          percent,
        };
      })
      .filter((item) => item.percent > 0)
      .sort((a, b) => b.rawValue - a.rawValue);
  }, [assets, currentTotal, totalValue]);

  const categoryDistributionMap = useMemo(() => {
    return new Map(categoryDistribution.map((item) => [item.category, item.rawValue]));
  }, [categoryDistribution]);

  const topCategory = categoryDistribution[0];

  const categoryPerformance = useMemo(() => {
    const categoryEntries = new Map<string, AssetControl[]>();

    assetControls.forEach((control) => {
      if (!control.category) return;
      const list = categoryEntries.get(control.category) ?? [];
      list.push(control);
      categoryEntries.set(control.category, list);
    });

    return PERFORMANCE_CATEGORIES.map(({ key, label }) => {
      const entries = categoryEntries.get(key);
      if (!entries || entries.length === 0) {
        const fallbackValue = categoryDistributionMap.get(key) ?? null;
        return { key, label, percentChange: null, currentValue: fallbackValue };
      }

      const sortedEntries = entries
        .slice()
        .sort(
          (a, b) =>
            new Date(a.controlDate).getTime() - new Date(b.controlDate).getTime()
        );

      const monthMap = new Map<
        string,
        { value: number; timestamp: number }
      >();

      sortedEntries.forEach((entry) => {
        const date = new Date(entry.controlDate);
        if (Number.isNaN(date.getTime())) return;
        const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
        const timestamp = date.getTime();
        const existing = monthMap.get(monthKey);
        if (!existing || timestamp > existing.timestamp) {
          monthMap.set(monthKey, {
            value: entry.currentTotalValue ?? 0,
            timestamp,
          });
        }
      });

      const monthlySeries = Array.from(monthMap.values()).sort(
        (a, b) => a.timestamp - b.timestamp
      );

      if (!monthlySeries.length) {
        const fallbackValue = categoryDistributionMap.get(key) ?? null;
        return { key, label, percentChange: null, currentValue: fallbackValue };
      }

      const currentMonth = monthlySeries[monthlySeries.length - 1];
      const previousMonth = monthlySeries[monthlySeries.length - 2];

      let percentChange: number | null = null;
      if (previousMonth && previousMonth.value !== 0) {
        percentChange =
          ((currentMonth.value - previousMonth.value) / previousMonth.value) *
          100;
      }

      const currentValue =
        categoryDistributionMap.get(key) ?? currentMonth.value ?? null;

      return { key, label, percentChange, currentValue };
    });
  }, [assetControls, categoryDistributionMap]);

  return (
    <Container maxWidth="xl" sx={{ py: 3, position: 'relative' }}>
      <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
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
                    {overallControls.length > 0 && (
                      <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                        desde {formatDate(overallControls[0].controlDate)}
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
            {topCategory && (
              <Grid size={{ xs: 12, md: 6, lg: 4 }}>
                <Card elevation={2}>
                  <CardContent>
                    <Typography color="text.secondary" gutterBottom>
                      Maior Categoria ({topCategory.name})
                    </Typography>
                    <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                      {formatCurrency(topCategory.rawValue)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      {topCategory.percent.toFixed(2)}% do total
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>

          {categoryDistribution.length > 0 && (
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid size={{ xs: 12, lg: 8 }}>
                <Card elevation={2} sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 1 }}>
                      Distribuição de Ativos por Categoria
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Percentual baseado no valor total atual da carteira
                    </Typography>
                    <Box sx={{ width: '100%', height: 360 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={categoryDistribution}
                            dataKey="percent"
                            nameKey="name"
                            innerRadius={70}
                            outerRadius={120}
                            paddingAngle={2}
                            label={(props: PieLabelRenderProps) => {
                              const value = Array.isArray(props.value) ? props.value[0] : props.value;
                              const pct = typeof value === 'number' ? value : 0;
                              return `${pct.toFixed(1)}%`;
                            }}
                          >
                            {categoryDistribution.map((entry) => (
                              <Cell
                                key={entry.category}
                                fill={CATEGORY_COLORS[entry.category]}
                              />
                            ))}
                          </Pie>
                          <RechartsTooltip
                            formatter={(_value: number, _name, item) => [
                              formatCurrency(item?.payload?.rawValue ?? 0),
                              item?.payload?.name ?? ''
                            ]}
                            contentStyle={{
                              backgroundColor: theme.palette.background.paper,
                              borderColor: theme.palette.divider,
                              borderRadius: theme.shape.borderRadius,
                              boxShadow: theme.shadows[2],
                            }}
                          />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, lg: 4 }}>
                <Grid container spacing={3}>
                  {categoryPerformance.map(({ key, label, percentChange, currentValue }) => (
                    <Grid key={key} size={{ xs: 12 }}>
                      <Card elevation={2}>
                        <CardContent>
                          <Typography color="text.secondary" gutterBottom>
                            {label}
                          </Typography>
                          <Typography
                            variant="h4"
                            sx={{
                              fontWeight: 'bold',
                              color:
                                typeof percentChange === 'number'
                                  ? percentChange > 0
                                    ? 'success.main'
                                    : percentChange < 0
                                      ? 'error.main'
                                      : 'text.primary'
                                  : 'text.primary'
                            }}
                          >
                            {typeof percentChange === 'number'
                              ? `${percentChange >= 0 ? '↑' : '↓'} ${Math.abs(percentChange).toFixed(2)}%`
                              : currentValue != null
                                ? formatCurrency(currentValue)
                                : '-'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            {typeof percentChange === 'number'
                              ? `Atual: ${formatCurrency(currentValue ?? 0)}`
                              : currentValue != null
                                ? 'Sem variação anterior disponível'
                                : 'Sem dados disponíveis'}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Grid>
            </Grid>
          )}

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
                      tickFormatter={(timestamp) => formatMonthYear(new Date(timestamp))}
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
                      labelFormatter={(label) => formatMonthYear(new Date(label))}
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
