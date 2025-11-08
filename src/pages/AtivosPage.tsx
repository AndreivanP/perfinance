import React, { useState, useEffect, useCallback } from 'react';
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
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { fetchAssets, deleteAsset, createAsset, updateAsset } from '../api/assets';
import { triggerAssetControl, triggerAssetControlByCategory } from '../api/assetControl';
import type { Asset } from '../api/assets';
import AssetForm from '../components/AssetForm';
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

  const handleSaveAsset = async (assetData: any) => {
    try {
      setLoading(true);
      if (editingAsset) {
        // Include the asset ID in the request payload when updating
        const updateData = { ...assetData, id: editingAsset.id };
        await updateAsset(editingAsset.id, updateData, username);
      } else {
        await createAsset(assetData, username);
      }
      
      // Trigger asset control update after successful save/update
      try {
        await triggerAssetControl(username);
        const categoryId = assetData?.category || editingAsset?.category;
        if (categoryId) {
          await triggerAssetControlByCategory(username, categoryId);
        }
      } catch (err) {
        console.warn('Warning: Could not update asset control', err);
        // Don't fail the whole operation if asset control update fails
      }
      
      setFormOpen(false);
      setEditingAsset(null);
      await loadAssets();
    } catch (err) {
      setError('Falha ao salvar o ativo. Tente novamente.');
      console.error('Error saving asset:', err);
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
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '1rem' }}>Ativo</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '1rem' }}>Valor Atual</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '1rem' }}>Corretora</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '1rem' }}>Data de Vencimento</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '1rem' }}>Categoria</TableCell>
                  <TableCell align="right"></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {assets
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((asset) => (
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
              </TableBody>
            </Table>
          </TableContainer>
          
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={assets.length}
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
