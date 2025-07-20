import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Avatar,
  IconButton,
  Typography,
  Grid,
  Card,
  CardContent,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Visibility,
  Search,
  FilterList,
  Refresh,
  Restaurant,
  Star,
  LocationOn,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';

import { restaurantAPI } from '../services/api';
import RestaurantForm from '../components/RestaurantForm';
import ConfirmDialog from '../components/ConfirmDialog';

const Restaurants = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [restaurantToDelete, setRestaurantToDelete] = useState(null);

  useEffect(() => {
    fetchRestaurants();
  }, [page, rowsPerPage, searchTerm, statusFilter]);

  const fetchRestaurants = async () => {
    try {
      setLoading(true);
      const response = await restaurantAPI.getRestaurants({
        page: page + 1,
        limit: rowsPerPage,
        search: searchTerm,
        status: statusFilter,
      });
      setRestaurants(response.data.restaurants);
      setTotal(response.data.total);
    } catch (error) {
      console.error('Failed to fetch restaurants:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  const handleStatusFilterChange = (event) => {
    setStatusFilter(event.target.value);
    setPage(0);
  };

  const handleAddRestaurant = () => {
    setSelectedRestaurant(null);
    setFormOpen(true);
  };

  const handleEditRestaurant = (restaurant) => {
    setSelectedRestaurant(restaurant);
    setFormOpen(true);
  };

  const handleDeleteRestaurant = (restaurant) => {
    setRestaurantToDelete(restaurant);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await restaurantAPI.deleteRestaurant(restaurantToDelete._id);
      setDeleteConfirmOpen(false);
      setRestaurantToDelete(null);
      fetchRestaurants();
    } catch (error) {
      console.error('Failed to delete restaurant:', error);
    }
  };

  const handleToggleStatus = async (restaurant) => {
    try {
      await restaurantAPI.updateRestaurant(restaurant._id, {
        isActive: !restaurant.isActive,
      });
      fetchRestaurants();
    } catch (error) {
      console.error('Failed to update restaurant status:', error);
    }
  };

  const handleFormSubmit = async (formData) => {
    try {
      if (selectedRestaurant) {
        await restaurantAPI.updateRestaurant(selectedRestaurant._id, formData);
      } else {
        await restaurantAPI.createRestaurant(formData);
      }
      setFormOpen(false);
      fetchRestaurants();
    } catch (error) {
      console.error('Failed to save restaurant:', error);
    }
  };

  const getStatusColor = (isActive) => {
    return isActive ? 'success' : 'error';
  };

  const getStatusText = (isActive) => {
    return isActive ? 'Active' : 'Inactive';
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Restaurants Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleAddRestaurant}
        >
          Add Restaurant
        </Button>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Search restaurants..."
                value={searchTerm}
                onChange={handleSearchChange}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1 }} />,
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={handleStatusFilterChange}
                  label="Status"
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={fetchRestaurants}
                disabled={loading}
              >
                Refresh
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Restaurants Table */}
      <Paper sx={{ width: '100%', mb: 2 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Restaurant</TableCell>
                <TableCell>Owner</TableCell>
                <TableCell>Address</TableCell>
                <TableCell>Rating</TableCell>
                <TableCell>Orders</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {restaurants.map((restaurant) => (
                <TableRow key={restaurant._id}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar
                        src={restaurant.imageUrl}
                        sx={{ mr: 2 }}
                      >
                        <Restaurant />
                      </Avatar>
                      <Box>
                        <Typography variant="body1" fontWeight="bold">
                          {restaurant.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {restaurant.description}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {restaurant.ownerId.fullName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {restaurant.ownerId.email}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <LocationOn sx={{ mr: 1, fontSize: 16 }} />
                      <Typography variant="body2">
                        {restaurant.address.city}, {restaurant.address.province}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Star sx={{ mr: 1, fontSize: 16, color: 'warning.main' }} />
                      <Typography variant="body2">
                        {restaurant.rating.toFixed(1)} ({restaurant.totalReviews})
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {restaurant.orderCount || 0}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getStatusText(restaurant.isActive)}
                      color={getStatusColor(restaurant.isActive)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => handleEditRestaurant(restaurant)}
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleToggleStatus(restaurant)}
                      >
                        <Switch
                          checked={restaurant.isActive}
                          size="small"
                        />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteRestaurant(restaurant)}
                        color="error"
                      >
                        <Delete />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={total}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* Restaurant Form Dialog */}
      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedRestaurant ? 'Edit Restaurant' : 'Add New Restaurant'}
        </DialogTitle>
        <DialogContent>
          <RestaurantForm
            restaurant={selectedRestaurant}
            onSubmit={handleFormSubmit}
            onCancel={() => setFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Restaurant"
        content={`Are you sure you want to delete "${restaurantToDelete?.name}"? This action cannot be undone.`}
      />
    </Box>
  );
};

export default Restaurants;