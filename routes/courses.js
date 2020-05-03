const express = require('express');
const { 
    getCourses,
    getCourse,
    addCourse,
    updateCourse,
    deleteCourse
} = require('../controller/courses');

const Course = require('../models/Course');
const avdancedResults = require('../middleware/advancedResults');

const router = express.Router({mergeParams: true});

router
    .route('/')
    .get(avdancedResults(Course, {
        path: 'bootcamp',
        select: 'name description'
    }),
    getCourses)
    .post(addCourse);

router
    .route('/:id')
    .get(getCourse)
    .put(updateCourse)
    .delete(deleteCourse);

module.exports = router;