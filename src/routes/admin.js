const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { adminAuth, superAdminOnly, serverOwnerOnly } = require('../middleware/admin');
const adminController = require('../controllers/adminController');

router.get('/dashboard', protect, adminAuth('admin', 'super_admin', 'server_owner', 'bd', 'moderator'), adminController.getDashboardStats);

router.get('/users', protect, adminAuth('admin', 'super_admin', 'server_owner', 'bd'), adminController.getUsers);
router.put('/users/:id/ban', protect, adminAuth('admin', 'super_admin', 'server_owner'), adminController.banUser);
router.put('/users/:id/verify', protect, adminAuth('admin', 'super_admin', 'server_owner'), adminController.verifyUser);
router.put('/users/:id/role', protect, superAdminOnly, adminController.updateUserRole);
router.post('/users/:id/add-coins', protect, adminAuth('admin', 'super_admin', 'server_owner'), adminController.addCoins);

router.get('/rooms', protect, adminAuth('admin', 'super_admin', 'server_owner', 'bd', 'moderator'), adminController.getRooms);
router.delete('/rooms/:id', protect, adminAuth('admin', 'super_admin', 'server_owner'), adminController.closeRoom);

router.get('/reports', protect, adminAuth('admin', 'super_admin', 'server_owner', 'bd', 'moderator'), adminController.getReports);
router.put('/reports/:id', protect, adminAuth('admin', 'super_admin', 'server_owner'), adminController.resolveReport);

router.get('/transactions', protect, adminAuth('admin', 'super_admin', 'server_owner', 'bd'), adminController.getTransactions);

router.post('/gifts', protect, adminAuth('admin', 'super_admin', 'server_owner'), adminController.manageGift);
router.put('/gifts/:id', protect, adminAuth('admin', 'super_admin', 'server_owner'), adminController.manageGift);
router.delete('/gifts/:id', protect, adminAuth('admin', 'super_admin', 'server_owner'), adminController.manageGift);

router.post('/vehicles', protect, adminAuth('admin', 'super_admin', 'server_owner'), adminController.manageVehicle);
router.put('/vehicles/:id', protect, adminAuth('admin', 'super_admin', 'server_owner'), adminController.manageVehicle);
router.delete('/vehicles/:id', protect, adminAuth('admin', 'super_admin', 'server_owner'), adminController.manageVehicle);

router.get('/agencies', protect, adminAuth('admin', 'super_admin', 'server_owner'), adminController.getAgencies);

router.get('/posts', protect, adminAuth('admin', 'super_admin', 'server_owner', 'bd'), adminController.getPosts);
router.delete('/posts/:id', protect, adminAuth('admin', 'super_admin', 'server_owner'), adminController.deletePost);

module.exports = router;
