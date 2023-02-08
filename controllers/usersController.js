const User = require('../models/User')
const Note = require('../models/Note')
const asyncHandler = require('express-async-handler')
const bcrypt = require('bcrypt')
const cloudinary = require("../utils/cloudinary");

// @desc Get all users
// @route GET /users
// @access Private
const getAllUsers = asyncHandler(async (req, res) => {
    // Get all users from MongoDB
    const users = await User.find().select('-password').lean()

    // If no users 
    if (!users?.length) {
        return res.status(400).json({ message: 'No users found' })
    }

    res.json(users)
})

// @desc Create new user
// @route POST /users
// @access Private
const createNewUser = async (req, res) => {
    const { name, username, password, roles, image } = req.body

    console.log(req.body)
    console.log(req.file.path)

    // Confirm data
    if (!name || !username || !password ) {
        return res.status(400).json({ message: 'All fields are required' })
    }

    // Check for duplicate username
    const duplicate = await User.findOne({ username }).collation({ locale: 'en', strength: 2 }).lean().exec()

    if (duplicate) {
        return res.status(409).json({ message: 'Duplicate username' })
    }

    // Hash password 
    const hashedPwd = await bcrypt.hash(password, 10) // salt rounds
    
    const result = await cloudinary.uploader.upload(req.file.path);

    const userObject = (!roles.length)
        ? { name,  username, "password": hashedPwd, "avatar": result.secure_url, "cloudinary_id":  result.public_id }
        : { name, username, "password": hashedPwd, roles, "avatar": result.secure_url, "cloudinary_id":  result.public_id }

    // Create and store new user 
    const user = await User.create(userObject)


    if (user) { //created 
        res.status(201).json({ message: `New user ${username} created` })
    } else {
        res.status(400).json({ message: 'Invalid user data received' })
    }
}

// @desc Update a user
// @route PATCH /users
// @access Private
const updateUser = asyncHandler(async (req, res) => {
    const { id, name, username, roles, active, password } = req.body

    console.log(req.body)
    console.log(req.file.path)

    // Confirm data 
    if (!id || !name || !username || !roles) {
        return res.status(400).json({ message: 'All fields except password are required' })
    }

    // Does the user exist to update?
    const user = await User.findById(id).exec()

    if (!user) {
        return res.status(400).json({ message: 'User not found' })
    }

    // Check for duplicate 
    const duplicate = await User.findOne({ username }).lean().exec()

    // Allow updates to the original user 
    if (duplicate && duplicate?._id.toString() !== id) {
        return res.status(409).json({ message: 'Duplicate username' })
    }

     // Delete image from cloudinary
     await cloudinary.uploader.destroy(user.cloudinary_id);
     // Upload image to cloudinary
     let result;
     if (req.file) {
       result = await cloudinary.uploader.upload(req.file.path);
     }

    user.name = name
    user.username = username
    user.roles = roles
    user.active = active
    user.avatar = result?.secure_url || user.avatar
    user.cloudinary_id = result?.public_id || user.cloudinary_id

    if (password) {
        // Hash password 
        user.password = await bcrypt.hash(password, 10) // salt rounds 
    }

    

    const updatedUser = await user.save()

    res.json({ message: `${updatedUser.username} updated` })
})

// @desc Delete a user
// @route DELETE /users
// @access Private
const deleteUser = asyncHandler(async (req, res) => {
    const { id } = req.body

    // Confirm data
    if (!id) {
        return res.status(400).json({ message: 'User ID Required' })
    }

    // Does the user still have assigned notes?
    const note = await Note.findOne({ user: id }).lean().exec()
    if (note) {
        return res.status(400).json({ message: 'User has assigned notes' })
    }

    // Does the user exist to delete?
    const user = await User.findById(id).exec()

    if (!user) {
        return res.status(400).json({ message: 'User not found' })
    }

    // Delete image from cloudinary
    await cloudinary.uploader.destroy(user.cloudinary_id);

    const result = await user.deleteOne()

    const reply = `Username ${result.username} with ID ${result._id} deleted`

    res.json(reply)
})

module.exports = {
    getAllUsers,
    createNewUser,
    updateUser,
    deleteUser
}