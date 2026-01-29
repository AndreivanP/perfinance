import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Button,
  CircularProgress,
  Alert,
  TablePagination,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  Popover,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import FilterListIcon from '@mui/icons-material/FilterList';
import { fetchAssets, deleteAsset, createAsset, updateAsset, topUpAsset, withdrawAsset } from '../api/assets';
import { triggerAssetControl, triggerAssetControlByCategory } from '../api/assetControl';
import type { Asset } from '../api/assets';
import AssetForm from '../components/AssetForm';
import AssetTransactionDialog, { type AssetTransactionType } from '../components/AssetTransactionDialog';
import { formatCurrency, formatDate } from '../utils/formatters';

// Map category values to their display labels
const CATEGORY_LABELS: Record<string, string> = {
  'RENDA_FIXA_POS': 'Renda Fixa POS',
  'RENDA_FIXA_PRE': 'Renda Fixa PRE',
  'RENDA_FIXA_IPCA': 'Renda Fixa IPCA',
  'ACOES': 'Ações',
  'CRIPTOMOEDAS': 'Criptomoedas',
  'IMOVEIS': 'Imóveis',
  'CARROS': 'Carros'
};

const AtivosPage: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [formOpen, setFormOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState<string | null>(null);
  const [transactionAsset, setTransactionAsset] = useState<Asset | null>(null);
  const [filters, setFilters] = useState({
    name: '',
    value: '',
    company: '',
    expiry: '',
    category: '',
  });
  const [filterVisibility, setFilterVisibility] = useState({
    name: false,
    value: false,
    company: false,
    expiry: false,
    category: false,
  });
  const [filterAnchors, setFilterAnchors] = useState<{
    name: HTMLElement | null;
    value: HTMLElement | null;
    company: HTMLElement | null;
    expiry: HTMLElement | null;
    category: HTMLElement | null;
  }>({
    name: null,
    value: null,
    company: null,
    expiry: null,
    category: null,
  });
  const filterInputRefs = useRef<{
    name: HTMLInputElement | null;
    value: HTMLInputElement | null;
    company: HTMLInputElement | null;
    expiry: HTMLInputElement | null;
    category: HTMLInputElement | null;
  }>({
    name: null,
    value: null,
    company: null,
    expiry: null,
    category: null,
  });

  const username = 'Andreivan'; // This should ideally come from auth context or user store

  const loadAssets = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchAssets(username);
      setAssets(data);
    } catch (err) {
      setError('Falha ao carregar os ativos. Tente novamente mais tarde.');
      console.error('Error loading assets:', err);
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    loadAssets();
  }, []);

  const handleDeleteClick = (id: string) => {
    setAssetToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!assetToDelete) return;
    const assetCategory = assets.find((asset) => asset.id === assetToDelete)?.category;
    
    try {
      setLoading(true);
      await deleteAsset(assetToDelete, username);
      
      // Trigger asset control update after successful deletion
      try {
        await triggerAssetControl(username);
        if (assetCategory) {
          await triggerAssetControlByCategory(username, assetCategory);
        }
      } catch (err) {
        console.warn('Warning: Could not update asset control after deletion', err);
        // Don't fail the whole operation if asset control update fails
      }
      
      await loadAssets(); // Reload the list after deletion
      setDeleteDialogOpen(false);
      setAssetToDelete(null);
    } catch (err) {
      setError('Falha ao excluir o ativo. Tente novamente.');
      console.error('Error deleting asset:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setAssetToDelete(null);
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleAddAsset = () => {
    setEditingAsset(null);
    setFormOpen(true);
  };

  const handleEditAsset = (asset: Asset) => {
    setEditingAsset(asset);
    setFormOpen(true);
  };

  const handleTransaction = (asset: Asset) => {
    setTransactionAsset(asset);
  };

  const focusFilterInput = (key: keyof typeof filterVisibility) => {
    requestAnimationFrame(() => {
      filterInputRefs.current[key]?.focus();
    });
  };

  const openFilter = (key: keyof typeof filterVisibility, anchor: HTMLElement) => {
    setFilterVisibility((prev) => ({ ...prev, [key]: true }));
    setFilterAnchors((prev) => ({ ...prev, [key]: anchor }));
    focusFilterInput(key);
  };

  const closeFilter = (key: keyof typeof filterVisibility) => {
    setFilterVisibility((prev) => ({ ...prev, [key]: false }));
    setFilterAnchors((prev) => ({ ...prev, [key]: null }));
  };

  const toggleFilterVisibility = (key: keyof typeof filterVisibility, anchor: HTMLElement) => {
    if (filterVisibility[key]) {
      closeFilter(key);
    } else {
      openFilter(key, anchor);
    }
  };

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(0);
  };

  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      const matchesName = asset.name.toLowerCase().includes(filters.name.toLowerCase());
      const matchesCompany = asset.company.toLowerCase().includes(filters.company.toLowerCase());
      const matchesCategory = (CATEGORY_LABELS[asset.category] || asset.category)
        .toLowerCase()
        .includes(filters.category.toLowerCase());
      const matchesExpiry = asset.expiryDate
        ? formatDate(asset.expiryDate).toLowerCase().includes(filters.expiry.toLowerCase())
        : filters.expiry.trim() === '' || '-'.includes(filters.expiry.toLowerCase());
      const valueStr = String(asset.current_value ?? '').replace(/\./g, ',');
      const matchesValue = valueStr.toLowerCase().includes(filters.value.toLowerCase());
      return matchesName && matchesCompany && matchesCategory && matchesExpiry && matchesValue;
    });
  }, [assets, filters]);

  const paginatedAssets = useMemo(
    () => filteredAssets.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [filteredAssets, page, rowsPerPage]
  );

  const totalFilteredValue = useMemo(
    () => filteredAssets.reduce((acc, asset) => acc + (asset.current_value ?? 0), 0),
    [filteredAssets]
  );

  const showTotalRow = useMemo(() => {
    if (filteredAssets.length === 0) return false;
    const lastPage = Math.max(0, Math.ceil(filteredAssets.length / rowsPerPage) - 1);
    return page === lastPage;
  }, [filteredAssets.length, page, rowsPerPage]);

  const handleSaveAsset = async (assetData: any) => {
    const categoryForControl = assetData?.category || editingAsset?.category || null;
    try {
      setLoading(true);
      if (editingAsset) {
        // Include the asset ID in the request payload when updating
        const updateData = { ...assetData, id: editingAsset.id };
        await updateAsset(editingAsset.id, updateData, username);
      } else {
        await createAsset(assetData, username);
      }
      
      setFormOpen(false);
      setEditingAsset(null);

      // Trigger asset control update after successful save/update
      try {
        await triggerAssetControl(username);
        if (categoryForControl) {
          await triggerAssetControlByCategory(username, categoryForControl);
        }
      } catch (err) {
        console.warn('Warning: Could not update asset control', err);
        // Don't fail the whole operation if asset control update fails
      }
      
      await loadAssets();
    } catch (err) {
      setError('Falha ao salvar o ativo. Tente novamente.');
      console.error('Error saving asset:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTransactionSubmit = async (type: AssetTransactionType, amount: number) => {
    if (!transactionAsset) return;
    const assetId = transactionAsset.id;

    try {
      setLoading(true);
      if (type === 'aporte') {
        await topUpAsset(assetId, amount, username);
      } else {
        await withdrawAsset(assetId, amount, username);
      }

      try {
        await triggerAssetControl(username);
        await triggerAssetControlByCategory(username, transactionAsset.category);
      } catch (err) {
        console.warn('Warning: Could not update asset control after transaction', err);
      }

      await loadAssets();
      setTransactionAsset(null);
    } catch (err) {
      setError('Falha ao salvar a transação. Tente novamente.');
      console.error('Error performing transaction:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <AssetForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={handleSaveAsset}
        asset={editingAsset}
      />
      <AssetTransactionDialog
        open={Boolean(transactionAsset)}
        onClose={() => setTransactionAsset(null)}
        onSubmit={handleTransactionSubmit}
      />
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 4,
        pb: 2,
        borderBottom: '1px solid',
        borderColor: 'divider'
      }}>
        <Box>
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
            Meus Ativos
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Gerencie seus investimentos
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleAddAsset}
        >
          Adicionar Ativo
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
        </Box>
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '1rem' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span>Ativo</span>
                      <IconButton
                        size="small"
                        color={filters.name ? 'primary' : 'default'}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFilterVisibility('name', e.currentTarget);
                        }}
                        aria-label="Filtrar ativo"
                      >
                        <FilterListIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '1rem' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                      <span>Valor Atual</span>
                      <IconButton
                        size="small"
                        color={filters.value ? 'primary' : 'default'}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFilterVisibility('value', e.currentTarget);
                        }}
                        aria-label="Filtrar valor"
                      >
                        <FilterListIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '1rem' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span>Corretora</span>
                      <IconButton
                        size="small"
                        color={filters.company ? 'primary' : 'default'}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFilterVisibility('company', e.currentTarget);
                        }}
                        aria-label="Filtrar corretora"
                      >
                        <FilterListIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '1rem' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span>Data de Vencimento</span>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFilterVisibility('expiry', e.currentTarget);
                        }}
                        aria-label="Filtrar data de vencimento"
                      >
                        <FilterListIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '1rem' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span>Categoria</span>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFilterVisibility('category', e.currentTarget);
                        }}
                        aria-label="Filtrar categoria"
                      >
                        <FilterListIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </TableCell>
                  <TableCell align="right" />
                </TableRow>
              </TableHead>
              <Popover
                open={filterVisibility.name}
                anchorEl={filterAnchors.name}
                onClose={() => closeFilter('name')}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                transformOrigin={{ vertical: 'top', horizontal: 'left' }}
              >
                <Box sx={{ p: 1.5, minWidth: 220 }}>
                  <TextField
                    size="small"
                    label="Filtrar ativo"
                    value={filters.name}
                    onChange={(e) => handleFilterChange('name', e.target.value)}
                    fullWidth
                    inputRef={(el) => { filterInputRefs.current.name = el; }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        closeFilter('name');
                      }
                    }}
                  />
                </Box>
              </Popover>
              <Popover
                open={filterVisibility.value}
                anchorEl={filterAnchors.value}
                onClose={() => closeFilter('value')}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              >
                <Box sx={{ p: 1.5, minWidth: 220 }}>
                  <TextField
                    size="small"
                    label="Filtrar valor"
                    value={filters.value}
                    onChange={(e) => handleFilterChange('value', e.target.value)}
                    fullWidth
                    inputProps={{ style: { textAlign: 'right' } }}
                    inputRef={(el) => { filterInputRefs.current.value = el; }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        closeFilter('value');
                      }
                    }}
                  />
                </Box>
              </Popover>
              <Popover
                open={filterVisibility.company}
                anchorEl={filterAnchors.company}
                onClose={() => closeFilter('company')}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                transformOrigin={{ vertical: 'top', horizontal: 'left' }}
              >
                <Box sx={{ p: 1.5, minWidth: 220 }}>
                  <TextField
                    size="small"
                    label="Filtrar corretora"
                    value={filters.company}
                    onChange={(e) => handleFilterChange('company', e.target.value)}
                    fullWidth
                    inputRef={(el) => { filterInputRefs.current.company = el; }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        closeFilter('company');
                      }
                    }}
                  />
                </Box>
              </Popover>
              <Popover
                open={filterVisibility.expiry}
                anchorEl={filterAnchors.expiry}
                onClose={() => closeFilter('expiry')}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                transformOrigin={{ vertical: 'top', horizontal: 'left' }}
              >
                <Box sx={{ p: 1.5, minWidth: 220 }}>
                  <TextField
                    size="small"
                    label="Filtrar vencimento"
                    value={filters.expiry}
                    onChange={(e) => handleFilterChange('expiry', e.target.value)}
                    fullWidth
                    inputRef={(el) => { filterInputRefs.current.expiry = el; }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        closeFilter('expiry');
                      }
                    }}
                  />
                </Box>
              </Popover>
              <Popover
                open={filterVisibility.category}
                anchorEl={filterAnchors.category}
                onClose={() => closeFilter('category')}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                transformOrigin={{ vertical: 'top', horizontal: 'left' }}
              >
                <Box sx={{ p: 1.5, minWidth: 220 }}>
                  <TextField
                    size="small"
                    label="Filtrar categoria"
                    value={filters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                    fullWidth
                    inputRef={(el) => { filterInputRefs.current.category = el; }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        closeFilter('category');
                      }
                    }}
                  />
                </Box>
              </Popover>
              <TableBody>
                {paginatedAssets.map((asset) => (
                    <TableRow key={asset.id} hover>
                      <TableCell>{asset.name}</TableCell>
                      <TableCell align="right">{formatCurrency(asset.current_value)}</TableCell>
                      <TableCell>{asset.company}</TableCell>
                      <TableCell>
                        {asset.expiryDate ? formatDate(asset.expiryDate) : '-'}
                      </TableCell>
                      <TableCell>
                        {CATEGORY_LABELS[asset.category] || asset.category}
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Editar">
                          <IconButton onClick={() => handleEditAsset(asset)} size="small">
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Aporte/Resgate">
                          <IconButton onClick={() => handleTransaction(asset)} size="small" color="primary">
                            <AddIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Excluir">
                          <IconButton
                            onClick={() => handleDeleteClick(asset.id)}
                            color="error"
                            size="small"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                {showTotalRow && (
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }} colSpan={1}>
                      Total
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                      {formatCurrency(totalFilteredValue)}
                    </TableCell>
                    <TableCell colSpan={4} />
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredAssets.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Itens por página:"
            labelDisplayedRows={({ from, to, count }) =>
              `${from}-${to} de ${count !== -1 ? count : `mais de ${to}`}`
            }
          />
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">Confirmar Exclusão</DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Tem certeza que deseja excluir este ativo? Esta ação não pode ser desfeita.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} color="primary">
            Cancelar
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error"
            variant="contained"
            autoFocus
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? 'Excluindo...' : 'Excluir'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AtivosPage;
