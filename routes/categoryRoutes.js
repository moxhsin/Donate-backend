const express = require('express');
const router = express.Router();
const Categories = require('../models/Categories');

router.post('/create', async (req, res) => {
    try {
        // Destructure the request body
        const { categoryName, imageUrl, createdUsername, createdUserEmail } = req.body;

        // Validate input
        if (!categoryName || !imageUrl || !createdUsername || !createdUserEmail) {
            return res.status(400).json({ message: 'All fields are required.' });
        }

        // Create a new category instance
        const newCategory = new Categories({
            categoryName,
            imageUrl,
            createdUsername,
            createdUserEmail,
        });

        // Save the category to the database
        await newCategory.save();

        // Send a success response
        return res.status(201).json({ message: 'Category created successfully!', category: newCategory });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error. Please try again later.' });
    }
});

router.get('/all', async (req, res) => {
    try {
        // Fetch all categories from the database
        const categories = await Categories.find({});

        // Check if categories exist
        if (!categories.length) {
            return res.status(404).json({ message: 'No categories found.' });
        }

        // Send the category names as a response
        return res.status(200).json(categories);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error. Please try again later.' });
    }
});

module.exports = router;