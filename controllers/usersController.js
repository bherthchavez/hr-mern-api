const User = require("../models/User");
const Note = require("../models/Note");
const asyncHandler = require("express-async-handler");
const bcrypt = require("bcrypt");
const cloudinary = require("../utils/cloudinary");

// @desc Get all users
// @route GET /users
// @access Private
const getAllUsers = asyncHandler(async (req, res) => {
  // Get all users from MongoDB
  const users = await User.find().select("-password").lean();

  // If no users
  if (!users?.length) {
    return res.status(400).json({ message: "No users found" });
  }

  res.json(users);
});

// @desc Create new user
// @route POST /users
// @access Private
const createNewUser = async (req, res) => {
  const { name, email, department, position, username, password, roles, image, userDocs } = req.body;

  // console.log(req.body)

  // Confirm data
  if (!name || !username || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  // Check for duplicate username
  const duplicate = await User.findOne({ username })
    .collation({ locale: "en", strength: 2 })
    .lean()
    .exec();

  if (duplicate) {
    return res.status(409).json({ message: "Duplicate username" });
  }

  // Hash password
  const hashedPwd = await bcrypt.hash(password, 10); // salt rounds

  const cloudinaryImageUploadMethod = async file => {
    return new Promise(resolve => {
      cloudinary.uploader.upload(file, (err, res) => {
        if (err) return res.status(500).send("upload image error")
        resolve({
          res: res.secure_url
        })
      }
      )
    })
  }


  const docsObject = []


  if (userDocs.length) {

    async function uploadDocs() {

      for (const docs of userDocs) {

        await cloudinary.uploader
          .upload(docs.Attachment, {
            resource_type: "auto"
          })
          .then((result) => {
            const tempDocsObject = {
              document_name: docs.Document_Name,
              document_no: docs.Document_No,
              issue_date: docs.Issue_Date,
              expiry_date: docs.Expiry_Date,
              document_format: result.format,
              document_url: result.url,
              document_cloud_id: result.public_id,
            }
            docsObject.push(tempDocsObject)

          })
          .catch((error) => {
            console.log("Error", JSON.stringify(error, null, 2))

          })
      }

    }

    await uploadDocs()
  }

  const result = await cloudinary.uploader.upload(image);

  const userObject = {
    name,
    email,
    position,
    department,
    username,
    password: hashedPwd,
    roles,
    avatar: result.secure_url,
    cloudinary_id: result.public_id,
    documents: docsObject
  }
  // Create and store new user
  const user = await User.create(userObject);
  if (user) {
    //created
    res.status(201).json({ message: `New user ${username} created` });
  } else {
    res.status(400).json({ message: "Invalid user data received" });
  }
};

// @desc Update a user
// @route PATCH /users
// @access Private
const updateUser = asyncHandler(async (req, res) => {
  const { id, name, username, roles, active, password, image, userDocs } = req.body;

  // Confirm data
  if (!id || !name || !username || !roles) {
    return res
      .status(400)
      .json({ message: "All fields except password are required" });
  }

  // Does the user exist to update?
  const user = await User.findById(id).exec();

  if (!user) {
    return res.status(400).json({ message: "User not found" });
  }

  // Check for duplicate
  const duplicate = await User.findOne({ username }).lean().exec();

  // Allow updates to the original user
  if (duplicate && duplicate?._id.toString() !== id) {
    return res.status(409).json({ message: "Duplicate username" });
  }

  let result;
  if (image) {
    // Delete image from cloudinary
    await cloudinary.uploader.destroy(user.cloudinary_id);
    // Upload image to cloudinary
    result = await cloudinary.uploader.upload(image);
  }

  console.log(userDocs)

  const docsObject = []

  if (userDocs.length) {

    async function uploadDocs() {

      for (const docs of userDocs) {

        if (!userDocs.Attachment) {

          await cloudinary.uploader.destroy(docs.document_cloud_id);

          await cloudinary.uploader
            .upload(docs.Attachment, {
              resource_type: "auto"
            })
            .then((result) => {
              const tempDocsObject = {
                document_name: docs.Document_Name,
                document_no: docs.Document_No,
                issue_date: docs.Issue_Date,
                expiry_date: docs.Expiry_Date,
                document_format: result.format,
                document_url: result.url,
                document_cloud_id: result.public_id,
              }
              docsObject.push(tempDocsObject)

            })
            .catch((error) => {
              console.log("Error", JSON.stringify(error, null, 2))

            })

        } else {

          const tempDocsObject = {
            document_name: docs.Document_Name,
            document_no: docs.Document_No,
            issue_date: docs.Issue_Date,
            expiry_date: docs.Expiry_Date,
            document_format: result.format,
            document_url: result.url,
            document_cloud_id: result.public_id,
          }
          docsObject.push(tempDocsObject)

        }

      }

    }

    await uploadDocs()

  } else {

    if (user.documents) {
      async function deleteDocs() {
        for (const docs of user.documents) {
          await cloudinary.uploader.destroy(docs.document_cloud_id);
        }
      }
      await deleteDocs()
    }
  }

  console.log(docsObject)


  user.name = name;
  user.username = username;
  user.roles = roles;
  user.active = active;
  user.avatar = result?.secure_url || user.avatar;
  user.cloudinary_id = result?.public_id || user.cloudinary_id;
  user.documents = docsObject

  if (password) {
    // Hash password
    user.password = await bcrypt.hash(password, 10); // salt rounds
  }

  console.log(user)

  const updatedUser = await user.save();

  res.json({ message: `${updatedUser.username} updated` });
});

// @desc Delete a user
// @route DELETE /users
// @access Private
const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.body;

  // Confirm data
  if (!id) {
    return res.status(400).json({ message: "User ID Required" });
  }

  // Does the user still have assigned notes?
  const note = await Note.findOne({ user: id }).lean().exec();
  if (note) {
    return res.status(400).json({ message: "User has assigned notes" });
  }

  // Does the user exist to delete?
  const user = await User.findById(id).exec();

  if (!user) {
    return res.status(400).json({ message: "User not found" });
  }

  // Delete image from cloudinary
  await cloudinary.uploader.destroy(user.cloudinary_id);
  if (user.documents.length) {
    user.documents.forEach(async (docs) => {
      await cloudinary.uploader.destroy(docs.document_cloud_id);
    })

  }


  const result = await user.deleteOne();

  const reply = `Username ${result.username} with ID ${result._id} deleted`;

  res.json(reply);
});

module.exports = {
  getAllUsers,
  createNewUser,
  updateUser,
  deleteUser,
};
