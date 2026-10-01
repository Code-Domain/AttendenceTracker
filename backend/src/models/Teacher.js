const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const teacherSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    password: {
      type: String,
      required: true
    },

    department: {
      type: String,
      default: ""
    },

    employeeId: {
      type: String,
      default: ""
    }
  },
  {
    timestamps: true
  }
);


/*
====================================================
HASH PASSWORD BEFORE SAVE
====================================================
*/

teacherSchema.pre("save", async function () {

  /*
  If password hasn't changed, don't hash it again.

  This is VERY important when updating other
  profile information.
  */

  if (!this.isModified("password")) {
    return;
  }

  /*
  Generate salt
  */

  const salt = await bcrypt.genSalt(10);

  /*
  Hash password exactly ONCE
  */

  this.password = await bcrypt.hash(
    this.password,
    salt
  );
});


/*
====================================================
COMPARE PASSWORD
====================================================
*/

teacherSchema.methods.comparePassword = async function (
  enteredPassword
) {
  return await bcrypt.compare(
    enteredPassword,
    this.password
  );
};


/*
====================================================
EXPORT MODEL
====================================================
*/

module.exports = mongoose.model(
  "Teacher",
  teacherSchema
);
