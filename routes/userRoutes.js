const express = require('express')
const router = express.Router()
const usersController = require('../controllers/usersController')
const verifyJWT = require('../middleware/verifyJWT')
const upload = require("../utils/multer");

router.use(verifyJWT)

router.route('/')
    .get(usersController.getAllUsers)
    .post(upload.single("image"),usersController.createNewUser)
    .patch(upload.single("image"),usersController.updateUser)
    .delete(usersController.deleteUser)

    
    
module.exports = router
