const { body } = require('express-validator');

const socialLoginValidation = [
  body('provider').equals('google').withMessage('Only Google sign-in is supported'),
  body('token').notEmpty(),
];

const updateProfileValidation = [
  body('displayName').optional().trim().isLength({ min: 2, max: 30 }),
  body('bio').optional().trim().isLength({ max: 500 }),
  body('gender').optional().isIn(['male', 'female', 'other', 'private']),
  body('age').optional().isInt({ min: 13, max: 120 }),
  body('country').optional().isLength({ max: 100 }),
];

module.exports = { socialLoginValidation, updateProfileValidation };
