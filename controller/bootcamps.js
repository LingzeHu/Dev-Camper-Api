const path = require('path');
const ErrprResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Bootcamp = require('../models/Bootcamp');
const geocoder = require('../utils/geocoder');

// @desc    Get all bootcamps
// @route   GET /api/v1/bootcamps
// @access  Public
exports.getBootcamps = asyncHandler( async (req, res, next) => {
    let query;

    // Copy req.requiry
    const reqQuery = { ...req.query };

    // Field to exclude
    const removeFields = ['select', 'sort', 'page', 'limit'];

    /// Loop over removeFields and delete them from reqQuery
    removeFields.forEach(param => delete reqQuery[param]);
    //console.log(reqQuery);

    // create query string
    let queryStr = JSON.stringify(reqQuery);

    // Create operators ($gt, &gte, &in, etc)
    // use to comparison filter/ whether exist in filter
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

    // Finding resource
    query = Bootcamp.find(JSON.parse(queryStr)).populate('courses');

    // Select Fields, mongoose
    if(req.query.select) {
        //console.log(req.query.select);
        const fields = req.query.select.split(',').join(' ');
        query = query.select(fields);
        //console.log(query);
    }

    // Sort
    if(req.query.sort) {
        const sortBy = req.query.sort.split(',').join(' ');
        query = query.sort(sortBy);
    } else {
        //default: descending createAt
        query = query.sort('-createAt');
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 25;
    const startIndex = (page -1) * limit;
    const endIndex = page * limit;
    const total = await Bootcamp.countDocuments();
    console.log(startIndex, endIndex, total);

    queryStr = query.skip(startIndex).limit(limit);

    // pagination  result
    const pagination = {};

    if(endIndex < total) {
        pagination.next = {
            page: page +1,
            limit
        }
    }
    console.log(pagination);

    if(startIndex > 0) {
        pagination.prev = {
            page: page -1,
            limit
        }
    }

    // Executing query
    const bootcamps = await query;
    res.status(200).json({
        success: true,
        count: bootcamps.length,
        pagination,
        data: bootcamps
    });
});

// @desc    Get signle bootcamps
// @route   GET /api/v1/bootcamps/:id
// @access  Public
exports.getBootcamp = asyncHandler( async (req, res, next) => {
    const bootcamp = await Bootcamp.findById(req.params.id);
    if(!bootcamp) {
        return next(
            new ErrprResponse(`Bootcamp not found with id of ${req.params.id}`, 404)
        );
    }
    res.status(200).json({
        success: true,
        data: bootcamp
    });
});

// @desc    Create a new bootcamp
// @route   POST /api/v1/bootcamps/
// @access  Private
exports.createBootcamp = asyncHandler( async (req, res, next) => {
    const bootcamp = await Bootcamp.create(req.body);
    res.status(201).json({
        success:true,
        data: bootcamp
    });
});

// @desc    Update a new bootcamp
// @route   PUT /api/v1/bootcamps/:id
// @access  Private
exports.updateBootcamp = asyncHandler( async (req, res, next) => {
    const bootcamp = await Bootcamp.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    if(!bootcamp) {
        res.status(400).json({success: false, err: err});
    }

    res.status(200).json({
        success: true,
        data: bootcamp
    });
});

// @desc    Delete a new bootcamp
// @route   DELETE /api/v1/bootcamps/:id
// @access  Private
exports.deleteBootcamp = asyncHandler( async (req, res, next) => {
    const bootcamp = await Bootcamp.findByIdAndDelete(req.params.id);

    if(!bootcamp) {
        return next(
            new ErrprResponse(`Bootcamp not found with id of ${req.params.id}`, 404)
        );
    }

    bootcamp.remove();

    res.status(200).json({
        success: true,
        data: {}
    });
});

// @desc    Get bootcamps within a radius
// @route   GET /api/v1/bootcamps/radius/:zipcode/:distance/
// @access  Private
exports.getBootcampsInRadius = asyncHandler( async (req, res, next) => {
    const {zipcode, distance} = req.params;

    // Get lat/lng from geocoder
    const loc = await geocoder.geocode(zipcode);
    const lat = loc[0].latitude;
    const lng = loc[0].longitude;

    // Calc radius using radians
    // Divide dist by radius of Earth
    // Earth Radius = 3,963 mi / 6,378 km
    const radius = distance / 3963;

    const bootcamps = await Bootcamp.find({
        location: {$geoWithin: { $centerSphere: [ [ lng, lat], radius] } }
    });

    res.status(200).json({
        success: true,
        count: bootcamps.length,
        data: bootcamps
    });

});

// @desc    Upload photo for bootcamp
// @route   PUT /api/v1/bootcamps/:id/photo
// @access  Private
exports.bootcampPhotoUpload = asyncHandler( async (req, res, next) => {
    const bootcamp = await Bootcamp.findById(req.params.id);

    if(!bootcamp) {
        return next(
            new ErrprResponse(`Bootcamp not found with id of ${req.params.id}`, 404)
        );
    }

    if(! req.files) {
        return next(
            new ErrprResponse(`Please upload the file`, 400)
        );
    }

    const file = req.files.file;
    //console.log(req.files.file);

    // Make sure the image is a photo
    if(! file.mimetype.startsWith('image')) {
        return next(
            new ErrprResponse(`Please upload a image`, 400)
        );
    }

    // Check filesize
    if(file.size > process.env.MAX_FILE_UPLOAD) {
        return next(
            new ErrprResponse(`Please upload a image less than ${process.env.MAX_FILE_UPLOAD}`, 400)
        );
    }

    // Create custom filename
    file.name = `photo_${bootcamp.id}${path.parse(file.name).ext}`;
    //console.log(file.name);

    file.mv(`${process.env.FILE_UPLOAD_PATH}/${file.name}`, async err => {
        if(err) {
            console.error(err);
            return next(
                new ErrprResponse(`Problem with file upload`, 500)
            );
        }
        await Bootcamp.findByIdAndUpdate(req.params.id, { photo: file.name });
        res.status(200).json({
            success: true,
            data: file.name
        });
    });
});