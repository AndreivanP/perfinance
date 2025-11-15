import React from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Divider,
} from '@mui/material';
import { useSettings } from '../context/SettingsContext';

const SettingsPage: React.FC = () => {
  const { settings, updateSetting } = useSettings();

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: 600, mb: 0.5 }}>
        Configurações
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
        Personalize o comportamento do painel. Novas opções serão adicionadas em breve.
      </Typography>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Visibilidade de Categorias
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Escolha quais categorias devem ser ocultadas nos indicadores do dashboard.
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <FormGroup>
            <FormControlLabel
              control={
                <Checkbox
                  checked={settings.hideImoveis}
                  onChange={(_e, checked) => updateSetting('hideImoveis', checked)}
                />
              }
              label="Ocultar Categoria Imóveis"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={settings.hideCarros}
                  onChange={(_e, checked) => updateSetting('hideCarros', checked)}
                />
              }
              label="Ocultar Categoria Carros"
            />
          </FormGroup>
        </CardContent>
      </Card>
    </Container>
  );
};

export default SettingsPage;
