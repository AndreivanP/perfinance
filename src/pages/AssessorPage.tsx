import { Box, Typography } from '@mui/material';

const AssessorPage = () => {
  return (
    <Box sx={{ p: 3 }}>
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
          Assessor Inteligente
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Análises e recomendações personalizadas
        </Typography>
      </Box>
      <Typography>Assessor Inteligente - Em breve</Typography>
    </Box>
  );
};

export default AssessorPage;
