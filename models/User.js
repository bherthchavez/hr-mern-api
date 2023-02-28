const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    position: {
      type: String,
      required: true,
    },
    department: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    roles: {
      type: String,
      required: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
    avatar: {
      type: String,
    },
    cloudinary_id: {
      type: String,
    },
    documents: [{
      document_name: String,
      document_no: String,
      issue_date: String,
      expiry_date: String,
      document_format: String,
      document_url: String,
      document_cloud_id: String,
    }]
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);
