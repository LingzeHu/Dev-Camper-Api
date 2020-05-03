const ErrprResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Bootcamp = require('../models/Bootcamp');
const User = require('../models/User');


// @desc    Register user
// @route   GET /api/v1/auth/register
// @access  Public
exports.register = asyncHandler( async (req, res, next) => {
    res.status(200).json({success: true})
});