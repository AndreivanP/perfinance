import React, { useEffect, useState, useMemo } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Button, 
  CircularProgress,
  Alert,
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
import { fetchTransactions } from '../api/transactions';
import type { AssetTransaction } from '../api/transactions';
import { useSettings } from '../context/SettingsContext';
import RefreshIcon from '@mui/icons-material/Refresh';
import ShowChartIcon from '@mui/icons-material/ShowChart';
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
  { key: 'RENDA_FIXA_POS', label: 'Renda Fixa Pós' },
  { key: 'RENDA_FIXA_IPCA', label: 'Renda Fixa IPCA' },
  { key: 'ACOES', label: 'Ações' },
];

const formatMonthYear = (date: Date) =>
  date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });

type ChartViewKey = 'overall' | 'RENDA_FIXA_POS' | 'RENDA_FIXA_IPCA' | 'ACOES';

const CHART_VIEWS: Record<ChartViewKey, { label: string; color: string; category: Asset['category'] | null }> = {
  overall: { label: 'Geral', color: '#2e7d32', category: null },
  RENDA_FIXA_POS: { label: 'Renda Fixa Pós', color: '#1976d2', category: 'RENDA_FIXA_POS' },
  RENDA_FIXA_IPCA: { label: 'Renda Fixa IPCA', color: '#388e3c', category: 'RENDA_FIXA_IPCA' },
  ACOES: { label: 'Ações', color: '#fb8c00', category: 'ACOES' },
} as const;

const buildQuarterlySeries = (
  records: AssetControl[],
  fallbackValue: number | null | undefined
) => {
  if (!records.length) {
    if (fallbackValue == null) return [];
    const now = new Date();
    now.setDate(1);
    now.setHours(0, 0, 0, 0);
    return [
      {
        date: now.getTime(),
        value: fallbackValue,
        formattedDate: formatMonthYear(now),
        formattedValue: formatCurrency(fallbackValue),
      },
    ];
  }

  const quarterMap = new Map<string, { date: Date; value: number }>();

  records.forEach((control) => {
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
    fallbackValue ?? records[records.length - 1]?.currentTotalValue ?? null;

  if (currentValue != null) {
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
};

const buildMonthlySeries = (
  records: AssetControl[],
  fallbackValue: number | null | undefined,
  months = 12
) => {
  const monthMap = new Map<string, { date: Date; value: number }>();

  records.forEach((control) => {
    const controlDate = new Date(control.controlDate);
    if (Number.isNaN(controlDate.getTime())) return;
    const monthStart = new Date(controlDate.getFullYear(), controlDate.getMonth(), 1);
    monthStart.setHours(0, 0, 0, 0);
    const key = `${monthStart.getFullYear()}-${monthStart.getMonth()}`;
    const existing = monthMap.get(key);

    if (!existing || control.currentTotalValue > existing.value) {
      monthMap.set(key, { date: monthStart, value: control.currentTotalValue });
    }
  });

  if (fallbackValue != null) {
    const now = new Date();
    now.setDate(1);
    now.setHours(0, 0, 0, 0);
    const currentKey = `${now.getFullYear()}-${now.getMonth()}`;
    const existing = monthMap.get(currentKey);
    if (!existing || fallbackValue > existing.value) {
      monthMap.set(currentKey, { date: now, value: fallbackValue });
    }
  }

  const sortedEntries = Array.from(monthMap.values()).sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  );

  if (!sortedEntries.length) {
    return [];
  }

  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  start.setMonth(start.getMonth() - (months - 1));

  let pointer = 0;
  let latestValue: number | null = null;

  while (
    pointer < sortedEntries.length &&
    sortedEntries[pointer].date.getTime() < start.getTime()
  ) {
    latestValue = sortedEntries[pointer].value;
    pointer++;
  }

  const result: Array<{
    date: number;
    value: number;
    formattedDate: string;
    formattedValue: string;
  }> = [];

  for (let i = 0; i < months; i++) {
    const monthDate = new Date(start);
    monthDate.setMonth(start.getMonth() + i);

    while (
      pointer < sortedEntries.length &&
      sortedEntries[pointer].date.getTime() <= monthDate.getTime()
    ) {
      latestValue = sortedEntries[pointer].value;
      pointer++;
    }

    if (latestValue == null) {
      continue;
    }

    result.push({
      date: monthDate.getTime(),
      value: latestValue,
      formattedDate: formatMonthYear(monthDate),
      formattedValue: formatCurrency(latestValue),
    });
  }

  return result;
};

const DashboardPage: React.FC = () => {
  const [assetControls, setAssetControls] = useState<AssetControl[]>([]);
  const [currentTotal, setCurrentTotal] = useState<CurrentTotal | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [transactions, setTransactions] = useState<AssetTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ChartViewKey>('overall');
  const theme = useTheme();
  const { settings } = useSettings();

  const hiddenCategories = useMemo(() => {
    const set = new Set<Asset['category']>();
    if (settings.hideImoveis) set.add('IMOVEIS');
    if (settings.hideCarros) set.add('CARROS');
    return set;
  }, [settings.hideImoveis, settings.hideCarros]);

  const hiddenCategoryNames = useMemo(() => {
    return Array.from(hiddenCategories).map(
      (category) => CATEGORY_LABELS[category] ?? category
    );
  }, [hiddenCategories]);

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
      try {
        const monthsToFetch = new Set<string>();

        PERFORMANCE_CATEGORIES.forEach(({ key }) => {
          const categoryControls = assetControlData.filter(
            (control) => control.category === key
          );
          if (!categoryControls.length) {
            return;
          }

          const monthMap = new Map<
            string,
            { year: number; month: number; timestamp: number }
          >();

          categoryControls.forEach((control) => {
            const parsed = new Date(control.controlDate);
            if (Number.isNaN(parsed.getTime())) return;
            const year = parsed.getFullYear();
            const month = parsed.getMonth();
            const monthKey = `${year}-${month}`;
            const timestamp = parsed.getTime();
            const existing = monthMap.get(monthKey);
            if (!existing || timestamp > existing.timestamp) {
              monthMap.set(monthKey, { year, month, timestamp });
            }
          });

          const monthlyEntries = Array.from(monthMap.values()).sort(
            (a, b) => a.timestamp - b.timestamp
          );
          monthlyEntries.slice(-2).forEach((entry) => {
            monthsToFetch.add(`${entry.year}-${entry.month}`);
          });
        });

        if (!monthsToFetch.size) {
          const now = new Date();
          monthsToFetch.add(`${now.getFullYear()}-${now.getMonth()}`);
        }

        const transactionResponses = await Promise.all(
          Array.from(monthsToFetch).map(async (monthKey) => {
            const [yearStr, monthStr] = monthKey.split('-');
            const year = Number(yearStr);
            const monthIndex = Number(monthStr);
            if (Number.isNaN(year) || Number.isNaN(monthIndex)) {
              return [];
            }
            try {
              return await fetchTransactions(username, monthIndex + 1, year);
            } catch (err) {
              console.error('Erro ao carregar transações do mês', monthKey, err);
              return [];
            }
          })
        );

        setTransactions(transactionResponses.flat());
      } catch (transactionsErr) {
        console.error('Erro inesperado ao processar transações:', transactionsErr);
        setTransactions([]);
      }
      
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

  const overallControls = useMemo(
    () => assetControls.filter((control) => !control.category),
    [assetControls]
  );

  const categoryControlMap = useMemo(() => {
    const map = new Map<Asset['category'], AssetControl[]>();
    assetControls.forEach((control) => {
      if (!control.category) return;
      const categoryKey = control.category as Asset['category'];
      const list = map.get(categoryKey) ?? [];
      list.push(control);
      map.set(categoryKey, list);
    });
    return map;
  }, [assetControls]);

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

  const hiddenValueSum = useMemo(() => {
    let sum = 0;
    hiddenCategories.forEach((category) => {
      sum += categoryDistributionMap.get(category) ?? 0;
    });
    return sum;
  }, [hiddenCategories, categoryDistributionMap]);

  const displayTotalValue = useMemo(
    () => Math.max(totalValue - hiddenValueSum, 0),
    [totalValue, hiddenValueSum]
  );

  const visibleCategoryDistribution = useMemo(() => {
    const visible = categoryDistribution.filter(
      (item) => !hiddenCategories.has(item.category)
    );
    const visibleTotal = visible.reduce((acc, item) => acc + item.rawValue, 0);
    if (visibleTotal <= 0) {
      return [];
    }
    return visible.map((item) => ({
      ...item,
      percent: Number(((item.rawValue / visibleTotal) * 100).toFixed(2)),
    }));
  }, [categoryDistribution, hiddenCategories]);

  const viewRecords = useMemo(() => {
    const config = CHART_VIEWS[viewMode];
    if (config.category) {
      return categoryControlMap.get(config.category) ?? [];
    }
    return overallControls;
  }, [viewMode, categoryControlMap, overallControls]);

  const fallbackValue = useMemo(() => {
    const config = CHART_VIEWS[viewMode];
    if (config.category) {
      return (
        categoryDistributionMap.get(config.category) ??
        (viewRecords.length
          ? viewRecords[viewRecords.length - 1].currentTotalValue
          : null)
      );
    }
    return (
      currentTotal?.current_total ??
      (viewRecords.length
        ? viewRecords[viewRecords.length - 1].currentTotalValue
        : null)
    );
  }, [viewMode, categoryDistributionMap, currentTotal, viewRecords]);

  const chartData = useMemo(() => {
    if (viewMode === 'overall') {
      return buildQuarterlySeries(viewRecords, fallbackValue);
    }
    return buildMonthlySeries(viewRecords, fallbackValue, 12);
  }, [viewMode, viewRecords, fallbackValue]);

  const currentChartConfig = CHART_VIEWS[viewMode];
  const chartGradientId = `colorValue-${viewMode}`;
  const chartViewEntries = Object.entries(CHART_VIEWS) as Array<
    [ChartViewKey, (typeof CHART_VIEWS)[ChartViewKey]]
  >;
  const hiddenCategoriesNote = useMemo(() => {
    if (!hiddenCategoryNames.length) return null;
    let formatted = hiddenCategoryNames[0];
    const plural = hiddenCategoryNames.length > 1;
    if (plural) {
      const allButLast = hiddenCategoryNames.slice(0, -1).join(', ');
      const last = hiddenCategoryNames[hiddenCategoryNames.length - 1];
      formatted = `${allButLast} e ${last}`;
    }
    const noun = plural ? 'das categorias' : 'da categoria';
    return `* Este gráfico inclui também os valores ${noun} ${formatted}.`;
  }, [hiddenCategoryNames]);

  const showHiddenCategoriesNote =
    viewMode === 'overall' && Boolean(hiddenCategoriesNote);

  const topCategory = categoryDistribution[0];

  const transactionNetByCategoryMonth = useMemo(() => {
    const map = new Map<string, number>();
    transactions.forEach((transaction) => {
      const date = new Date(transaction.transactionDate);
      if (Number.isNaN(date.getTime())) return;
      const key = `${transaction.category}-${date.getFullYear()}-${date.getMonth()}`;
      const current = map.get(key) ?? 0;
      const amount = transaction.type === 'TOP_UP' ? transaction.amount : -transaction.amount;
      map.set(key, current + amount);
    });
    return map;
  }, [transactions]);

  const categoryPerformance = useMemo(() => {
    return PERFORMANCE_CATEGORIES.map(({ key, label }) => {
      const entries = categoryControlMap.get(key);
      if (!entries || entries.length === 0) {
        const fallbackValue = categoryDistributionMap.get(key) ?? null;
        return { key, label, percentChange: null, currentValue: fallbackValue, deltaValue: null };
      }

      const sortedEntries = entries
        .slice()
        .sort(
          (a, b) =>
            new Date(a.controlDate).getTime() - new Date(b.controlDate).getTime()
        );

      const monthMap = new Map<
        string,
        { value: number; timestamp: number; year: number; month: number }
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
            year: date.getFullYear(),
            month: date.getMonth(),
          });
        }
      });

      const monthlySeries = Array.from(monthMap.values()).sort(
        (a, b) => a.timestamp - b.timestamp
      );

      // Expect chronological monthlySeries
      if (!monthlySeries.length) {
        const currentValue = categoryDistributionMap.get(key) ?? null;
        return { key, label, percentChange: null, currentValue, deltaValue: null };
      }

      const currentMonth = monthlySeries[monthlySeries.length - 1];
      const previousMonth = monthlySeries[monthlySeries.length - 2];

      let percentChange: number | null = null;
      let deltaValue: number | null = null;
      if (previousMonth) {
        const currentKey = `${key}-${currentMonth.year}-${currentMonth.month}`;
        const previousKey = `${key}-${previousMonth.year}-${previousMonth.month}`;
        const currentNet = transactionNetByCategoryMonth.get(currentKey) ?? 0;
        const previousNet = transactionNetByCategoryMonth.get(previousKey) ?? 0;

        const adjustedCurrent = currentMonth.value - currentNet;
        const adjustedPrevious = previousMonth.value - previousNet;
        deltaValue = adjustedCurrent - adjustedPrevious;
        if (adjustedPrevious !== 0) {
          percentChange = (deltaValue / adjustedPrevious) * 100;
        }
      }

      const currentValue =
        categoryDistributionMap.get(key) ?? currentMonth.value ?? null;

      return { key, label, percentChange, currentValue, deltaValue };
    });
  }, [categoryControlMap, categoryDistributionMap, transactionNetByCategoryMonth]);

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
                    {formatCurrency(displayTotalValue)}
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

          {visibleCategoryDistribution.length > 0 && (
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
                            data={visibleCategoryDistribution}
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
                            {visibleCategoryDistribution.map((entry) => (
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
                  {categoryPerformance.map(({ key, label, percentChange, currentValue, deltaValue }) => {
                    const percentColor =
                      typeof percentChange === 'number'
                        ? percentChange > 0
                          ? 'success.main'
                          : percentChange < 0
                            ? 'error.main'
                            : 'text.primary'
                        : 'text.primary';

                    const deltaColor =
                      typeof deltaValue === 'number'
                        ? deltaValue > 0
                          ? 'success.main'
                          : deltaValue < 0
                            ? 'error.main'
                            : 'text.secondary'
                        : 'text.secondary';

                    return (
                    <Grid key={key} size={{ xs: 12 }}>
                      <Card elevation={2}>
                        <CardContent>
                          <Typography color="text.secondary" gutterBottom>
                            {label}
                          </Typography>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
                            <Typography
                              variant="h4"
                              sx={{
                                fontWeight: 'bold',
                                color: percentColor,
                              }}
                            >
                              {typeof percentChange === 'number'
                                ? `${percentChange >= 0 ? '↑' : '↓'} ${Math.abs(percentChange).toFixed(2)}%`
                                : currentValue != null
                                  ? formatCurrency(currentValue)
                                  : '-'}
                            </Typography>
                            <Box sx={{ textAlign: 'right' }}>
                              {typeof percentChange === 'number' ? (
                                <>
                                  <Typography
                                    variant="subtitle2"
                                    sx={{ fontWeight: 600, color: deltaColor }}
                                  >
                                    {typeof deltaValue === 'number' && deltaValue !== 0
                                      ? `${deltaValue > 0 ? '+' : '-'} ${formatCurrency(Math.abs(deltaValue))}`
                                      : formatCurrency(currentValue ?? 0)}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    Diferença mensal
                                  </Typography>
                                </>
                              ) : currentValue != null ? (
                                <>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                    {formatCurrency(currentValue)}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    Valor atual
                                  </Typography>
                                </>
                              ) : null}
                            </Box>
                          </Box>
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
                    );
                  })}
                </Grid>
              </Grid>
            </Grid>
          )}

          {/* Alternar entre visões do gráfico */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
            <Typography variant="h6">Desempenho dos Ativos</Typography>
            <ToggleButtonGroup
              color="primary"
              value={viewMode}
              exclusive
              onChange={(_e, newView) => newView && setViewMode(newView)}
              size="small"
            >
              {chartViewEntries.map(([key, config]) => (
                <ToggleButton
                  key={key}
                  value={key}
                  aria-label={`visualização ${config.label}`}
                  sx={{
                    textTransform: 'none',
                    color: viewMode === key ? config.color : 'inherit',
                    '&.Mui-selected': {
                      backgroundColor: 'action.selected',
                      color: config.color,
                    },
                  }}
                >
                  <ShowChartIcon sx={{ mr: 1 }} /> {config.label}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Box>

          {/* Main Content */}
          <Card elevation={2} sx={{ mb: 3 }}>
            <Box sx={{ p: 3, height: '500px', width: '100%' }}>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
                >
                  <defs>
                    <linearGradient id={chartGradientId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={currentChartConfig.color} stopOpacity={0.8} />
                      <stop offset="95%" stopColor={currentChartConfig.color} stopOpacity={0.1} />
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
                    stroke={currentChartConfig.color}
                    fillOpacity={1}
                    fill={`url(#${chartGradientId})`}
                    activeDot={{ r: 8 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
            {showHiddenCategoriesNote && hiddenCategoriesNote && (
              <Typography variant="caption" color="text.secondary" sx={{ px: 3, pb: viewMode === 'overall' ? 1 : 0 }}>
                {hiddenCategoriesNote}
              </Typography>
            )}
            {viewMode !== 'overall' && (
              <Typography variant="caption" color="text.secondary" sx={{ px: 3, pb: 3 }}>
                * Dados referentes aos últimos 12 meses.
              </Typography>
            )}
          </Card>
        </>
      )}
    </Container>
  );
};

export default DashboardPage;
