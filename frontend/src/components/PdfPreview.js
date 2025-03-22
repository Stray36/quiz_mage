import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Grid,
  Checkbox,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Alert,
  FormControlLabel
} from '@mui/material';
import DoneIcon from '@mui/icons-material/Done';
import CloseIcon from '@mui/icons-material/Close';

export default function PdfPreview({ file, onPagesSelected, onClose }) {
  const [loading, setLoading] = useState(true);
  const [previews, setPreviews] = useState([]);
  const [selectedPages, setSelectedPages] = useState([]);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    if (!file) {
      return;
    }
    
    const uploadPdf = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch('http://localhost:5000/pdf-preview', {
          method: 'POST',
          body: formData,
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || '生成预览失败');
        }
        
        setPreviews(data.previews);
        
        // 默认选中所有页面
        const allPages = data.previews.map(preview => preview.page);
        setSelectedPages(allPages);
      } catch (error) {
        console.error('PDF预览生成错误:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    
    uploadPdf();
  }, [file]);
  
  const handlePageToggle = (pageNum) => {
    setSelectedPages(prevSelected => {
      if (prevSelected.includes(pageNum)) {
        return prevSelected.filter(p => p !== pageNum);
      } else {
        return [...prevSelected, pageNum];
      }
    });
  };
  
  const handleSelectAll = () => {
    const allPages = previews.map(preview => preview.page);
    setSelectedPages(allPages);
  };
  
  const handleDeselectAll = () => {
    setSelectedPages([]);
  };
  
  const handleConfirm = () => {
    onPagesSelected(selectedPages);
  };
  
  return (
    <Dialog 
      open={true} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      aria-labelledby="pdf-preview-dialog-title"
    >
      <DialogTitle id="pdf-preview-dialog-title">
        选择PDF页面
      </DialogTitle>
      
      <DialogContent dividers>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
            <Typography variant="body1" sx={{ ml: 2 }}>
              正在生成PDF预览，这可能需要一些时间...
            </Typography>
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : (
          <>
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body1">
                共 {previews.length} 页，已选择 {selectedPages.length} 页
              </Typography>
              <Box>
                <Button 
                  variant="outlined" 
                  size="small" 
                  onClick={handleSelectAll} 
                  sx={{ mr: 1 }}
                  startIcon={<DoneIcon />}
                >
                  全选
                </Button>
                <Button 
                  variant="outlined" 
                  size="small" 
                  onClick={handleDeselectAll}
                  startIcon={<CloseIcon />}
                >
                  取消全选
                </Button>
              </Box>
            </Box>
            
            <Grid container spacing={2}>
              {previews.map((preview) => (
                <Grid item xs={6} sm={4} md={3} key={preview.page}>
                  <Paper 
                    elevation={selectedPages.includes(preview.page) ? 8 : 1}
                    sx={{ 
                      p: 1, 
                      border: selectedPages.includes(preview.page) ? '2px solid #1976d2' : '1px solid #eee',
                      position: 'relative',
                      transition: 'all 0.2s',
                      cursor: 'pointer',
                      ':hover': {
                        boxShadow: 4
                      }
                    }}
                    onClick={() => handlePageToggle(preview.page)}
                  >
                    <img 
                      src={preview.image} 
                      alt={`Page ${preview.page + 1}`} 
                      style={{ width: '100%', height: 'auto' }}
                    />
                    <Box 
                      sx={{ 
                        position: 'absolute', 
                        top: 5, 
                        right: 5,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        backgroundColor: selectedPages.includes(preview.page) ? 'primary.main' : 'background.paper',
                        border: selectedPages.includes(preview.page) ? 'none' : '1px solid #ccc',
                      }}
                    >
                      {selectedPages.includes(preview.page) && (
                        <DoneIcon fontSize="small" sx={{ color: 'white' }} />
                      )}
                    </Box>
                    <Typography 
                      variant="body2" 
                      align="center" 
                      sx={{ 
                        mt: 1, 
                        fontWeight: selectedPages.includes(preview.page) ? 'bold' : 'normal',
                        color: selectedPages.includes(preview.page) ? 'primary.main' : 'text.primary'
                      }}
                    >
                      第 {preview.page + 1} 页
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </>
        )}
      </DialogContent>
      
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose}>取消</Button>
        <Button 
          onClick={handleConfirm} 
          variant="contained" 
          color="primary"
          disabled={loading || selectedPages.length === 0}
        >
          确认选择 ({selectedPages.length} 页)
        </Button>
      </DialogActions>
    </Dialog>
  );
}