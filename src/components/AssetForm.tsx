import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControlLabel,
  Checkbox,
  Box,
  IconButton,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { format } from 'date-fns';

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

  const [formData, setFormData] = useState({
    name: '',
    current_value: '',
    company: '',
    expiryDate: '',
    is_variable_income: false,
    initial_value: '',
    interest_rate: '',
  });

  useEffect(() => {
    if (asset) {
      setFormData({
        name: asset.name || '',
        current_value: asset.current_value ? asset.current_value.toString().replace('.', ',') : '',
        initial_value: asset.initial_value ? asset.initial_value.toString().replace('.', ',') : '',
        company: asset.company || '',
        expiryDate: asset.expiryDate ? asset.expiryDate.split('T')[0] : '',
        interest_rate: asset.interest_rate ? asset.interest_rate.toString() : '',
        is_variable_income: asset.is_variable_income || false,
      });
    } else {
      setFormData({
        name: '',
        current_value: '',
        company: '',
        expiryDate: '',
        is_variable_income: false,
        initial_value: '',
        interest_rate: '',
      });
    }
  }, [asset]);

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

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      current_value: formData.current_value ? parseCurrency(formData.current_value) : 0,
      initial_value: formData.initial_value ? parseCurrency(formData.initial_value) : 0,
      interest_rate: Number(formData.interest_rate) || 0,
      expiryDate: formData.expiryDate ? format(new Date(formData.expiryDate), 'yyyy-MM-dd') : null,
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
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
          <Box display="grid" gap={2}>
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
            
            <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
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

            <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
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

            <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
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
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.is_variable_income}
                    onChange={handleCheckboxChange}
                    name="is_variable_income"
                    color="primary"
                  />
                }
                label="Renda Variável"
                sx={{ mt: 2, ml: 1 }}
              />
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
