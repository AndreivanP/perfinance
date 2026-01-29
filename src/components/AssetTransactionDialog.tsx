import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  ToggleButtonGroup,
  ToggleButton,
  Stack,
  Typography,
} from '@mui/material';

export type AssetTransactionType = 'aporte' | 'resgate';

interface AssetTransactionDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (type: AssetTransactionType, amount: number) => Promise<void>;
}

const AssetTransactionDialog: React.FC<AssetTransactionDialogProps> = ({
  open,
  onClose,
  onSubmit,
}) => {
  const [transactionType, setTransactionType] = useState<AssetTransactionType>('aporte');
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setTransactionType('aporte');
      setAmount('');
      setError(null);
      setSubmitting(false);
    }
  }, [open]);

  const handleSubmit = async () => {
    const parsedAmount = Number(amount);
    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Informe um valor válido.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(transactionType, parsedAmount);
      onClose();
    } catch (err) {
      console.error('Erro ao salvar transação:', err);
      setError('Falha ao salvar a transação. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Registrar Transação</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Tipo de operação
          </Typography>
          <ToggleButtonGroup
            color="primary"
            exclusive
            value={transactionType}
            onChange={(_event, value) => value && setTransactionType(value)}
          >
            <ToggleButton value="aporte">Aporte</ToggleButton>
            <ToggleButton value="resgate">Resgate</ToggleButton>
          </ToggleButtonGroup>
          <TextField
            label="Valor"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            fullWidth
            inputProps={{ min: 0, step: '0.01' }}
          />
          {error && (
            <Typography variant="body2" color="error">
              {error}
            </Typography>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={submitting}
        >
          {submitting ? 'Salvando...' : 'Salvar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AssetTransactionDialog;
