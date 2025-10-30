import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  IconButton,
  Typography,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import CloseIcon from '@mui/icons-material/Close';

interface AssetFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (asset: any) => void;
  asset?: any;
}

const AssetForm: React.FC<AssetFormProps> = ({ open, onClose, onSave, asset }) => {
  const formatCurrency = (value: number | string): string => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return isNaN(num) ? '' : num.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const parseCurrency = (value: string): number => {
    return parseFloat(value.replace(/\./g, '').replace(',', '.')) || 0;
  };

  interface FormData {
    name: string;
    current_value: string;
    company: string;
    expiryDate: string;
    category: 'RENDA_FIXA_POS' | 'RENDA_FIXA_PRE' | 'RENDA_FIXA_IPCA' | 'ACOES' | 'CRIPTOMOEDAS' | 'IMOVEIS' | 'CARROS';
    initial_value: string;
    interest_rate: string;
  }

  // Define a type for the category
  type CategoryType = 'RENDA_FIXA_POS' | 'RENDA_FIXA_PRE' | 'RENDA_FIXA_IPCA' | 'ACOES' | 'CRIPTOMOEDAS' | 'IMOVEIS' | 'CARROS';

  const [formData, setFormData] = useState({
    name: '',
    current_value: '',
    company: '',
    expiryDate: '',
    category: 'RENDA_FIXA_POS' as CategoryType,
    initial_value: '',
    interest_rate: '',
  });

  const CATEGORIES = [
    { value: 'RENDA_FIXA_POS' as const, label: 'Renda Fixa POS' },
    { value: 'RENDA_FIXA_PRE' as const, label: 'Renda Fixa PRE' },
    { value: 'RENDA_FIXA_IPCA' as const, label: 'Renda Fixa IPCA' },
    { value: 'ACOES' as const, label: 'Ações' },
    { value: 'CRIPTOMOEDAS' as const, label: 'Criptomoedas' },
    { value: 'IMOVEIS' as const, label: 'Imóveis' },
    { value: 'CARROS' as const, label: 'Carros' },
  ] as const;

  useEffect(() => {
    if (asset) {
      const newFormData: FormData = {
        name: asset.name || '',
        current_value: asset.current_value ? asset.current_value.toString().replace(/\./g, ',').replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.') : '',
        initial_value: asset.initial_value ? asset.initial_value.toString().replace(/\./g, ',').replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.') : '',
        company: asset.company || '',
        expiryDate: asset.expiryDate ? asset.expiryDate.split('T')[0] : '',
        interest_rate: asset.interest_rate ? asset.interest_rate.toString() : '',
        category: (asset.category || 'RENDA_FIXA_POS') as FormData['category'],
      };
      setFormData(newFormData);
    } else {
      setFormData({
        name: '',
        current_value: '',
        company: '',
        expiryDate: '',
        category: 'RENDA_FIXA_POS',
        initial_value: '',
        interest_rate: '',
      });
    }
  }, [asset, open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  const handleCurrencyBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'current_value' || name === 'initial_value') {
      const numValue = parseFloat(value.replace(/[^0-9,-]+/g, '').replace(',', '.')) || 0;
      setFormData(prev => ({
        ...prev,
        [name]: numValue.toFixed(2).replace('.', ',')
      }));
    }
  };

  const handleCategoryChange = (e: SelectChangeEvent) => {
    const value = e.target.value as CategoryType;
    setFormData(prev => ({
      ...prev,
      category: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const assetData = {
      ...formData,
      current_value: parseCurrency(formData.current_value),
      initial_value: parseCurrency(formData.initial_value),
      interest_rate: formData.interest_rate ? parseFloat(formData.interest_rate) : null,
      expiryDate: formData.expiryDate || null,
      category: formData.category,
    };
    
    onSave(assetData);
  };

  // Generate a unique key for the form to force re-render when editing different assets
  const formKey = asset ? `edit-${asset.id}` : 'new';
  
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth key={formKey}>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            {asset ? 'Editar Ativo' : 'Adicionar Novo Ativo'}
          </Typography>
          <IconButton edge="end" color="inherit" onClick={onClose} aria-label="close">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 400 }}>
            <TextField
              name="name"
              label="Nome do Ativo"
              value={formData.name}
              onChange={handleChange}
              fullWidth
              required
              margin="normal"
              variant="outlined"
            />
            
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                name="current_value"
                label="Valor Atual"
                value={formData.current_value}
                onChange={handleChange}
                onBlur={handleCurrencyBlur}
                fullWidth
                margin="normal"
                inputProps={{
                  inputMode: 'decimal',
                }}
                InputProps={{
                  startAdornment: 'R$ ',
                }}
              />
              <TextField
                name="initial_value"
                label="Valor Inicial"
                value={formData.initial_value}
                onChange={handleChange}
                onBlur={handleCurrencyBlur}
                fullWidth
                margin="normal"
                inputProps={{
                  inputMode: 'decimal',
                }}
                InputProps={{
                  startAdornment: 'R$ ',
                }}
              />
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                name="company"
                label="Corretora/Instituição"
                value={formData.company}
                onChange={handleChange}
                required
                margin="normal"
                variant="outlined"
              />
              <TextField
                name="expiryDate"
                label="Data de Vencimento"
                type="date"
                value={formData.expiryDate}
                onChange={handleChange}
                margin="normal"
                variant="outlined"
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                name="interest_rate"
                label="Taxa de Juros (%)"
                type="number"
                value={formData.interest_rate}
                onChange={handleChange}
                margin="normal"
                variant="outlined"
                inputProps={{
                  step: '0.01',
                  min: '0'
                }}
              />
              <FormControl fullWidth margin="normal" variant="outlined">
                <InputLabel id="category-label">Categoria</InputLabel>
                <Select
                  labelId="category-label"
                  id="category"
                  value={formData.category}
                  label="Categoria"
                  onChange={handleCategoryChange}
                  sx={{ mt: 1 }}
                >
                  {CATEGORIES.map((category) => (
                    <MenuItem key={category.value} value={category.value}>
                      {category.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={onClose} color="primary">
            Cancelar
          </Button>
          <Button type="submit" color="primary" variant="contained">
            Salvar
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default AssetForm;
