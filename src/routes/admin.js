const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { adminAuth, superAdminOnly } = require('../middleware/admin');
const adminController = require('../controllers/adminController');

router.get('/dashboard', protect, adminAuth('admin', 'super_admin', 'moderator'), adminController.getDashboardStats);

router.get('/users', protect, adminAuth('admin', 'super_admin'), adminController.getUsers);
router.put('/users/:id/ban', protect, adminAuth('admin', 'super_admin'), adminController.banUser);
router.put('/users/:id/verify', protect, adminAuth('admin', 'super_admin'), adminController.verifyUser);
router.put('/users/:id/role', protect, superAdminOnly, adminController.updateUserRole);
router.post('/users/:id/add-coins', protect, adminAuth('admin', 'super_admin'), adminController.addCoins);

router.get('/rooms', protect, adminAuth('admin', 'super_admin', 'moderator'), adminController.getRooms);
router.delete('/rooms/:id', protect, adminAuth('admin', 'super_admin'), adminController.closeRoom);

router.get('/reports', protect, adminAuth('admin', 'super_admin', 'moderator'), adminController.getReports);
router.put('/reports/:id', protect, adminAuth('admin', 'super_admin'), adminController.resolveReport);

router.get('/transactions', protect, adminAuth('admin', 'super_admin'), adminController.getTransactions);

router.post('/gifts', protect, adminAuth('admin', 'super_admin'), adminController.manageGift);
router.put('/gifts/:id', protect, adminAuth('admin', 'super_admin'), adminController.manageGift);
router.delete('/gifts/:id', protect, adminAuth('admin', 'super_admin'), adminController.manageGift);

router.post('/vehicles', protect, adminAuth('admin', 'super_admin'), adminController.manageVehicle);
router.put('/vehicles/:id', protect, adminAuth('admin', 'super_admin'), adminController.manageVehicle);
router.delete('/vehicles/:id', protect, adminAuth('admin', 'super_admin'), adminController.manageVehicle);

router.get('/agencies', protect, adminAuth('admin', 'super_admin'), adminController.getAgencies);

router.get('/posts', protect, adminAuth('admin', 'super_admin'), adminController.getPosts);
router.delete('/posts/:id', protect, adminAuth('admin', 'super_admin'), adminController.deletePost);

module.exports = router;
