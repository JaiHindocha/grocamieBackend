const express = require("express");
const { check, validationResult } = require("express-validator/check");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const router = express.Router();
const auth = require("../middleware/auth");

const User = require("../model/User");
const Cart = require("../model/Cart");
const MasterCart = require("../model/MasterCart")

router.post(
  "/signup",
  [
    check("email", "Please enter a valid email").isEmail(),
    check("password", "Please enter a valid password").isLength({
      min: 6
    })
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array()
      });
    }

    const {address,alpha,email,communityCode,communityName,contactNo,name,profileUrl,verified,password} = req.body;
    try {
      let user = await User.findOne({
        email
      });
      if (user) {
        return res.status(400).json({
          msg: "User Already Exists"
        });
      }

      user = new User({
        address,
        alpha,
        email,
        communityCode,
        communityName,
        contactNo,
        name,
        profileUrl,
        verified,
        password
      });

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);

      await user.save();

      const payload = {
        user: {
          id: user.id,
          alpha: user.alpha,
          communityCode: user.communityCode,
          name: user.name
        }
      };

      cart = new Cart({
        _id: user.id
      });

      await cart.save();

      if (user.alpha == true) {
        masterCart = new MasterCart ({
          _id: user.communityCode
        });
        await masterCart.save();
      }

      jwt.sign(
        payload,
        "randomString",
        {
          expiresIn: 10000
        },
        (err, token) => {
          if (err) throw err;
          res.status(200).json({
            token
          });
        }
      );
    } catch (err) {
      console.log(err.message);
      res.status(500).send("Error in Saving");
    }
  }
);

router.post(
  "/login",
  [
    check("email", "Please enter a valid email").isEmail(),
    check("password", "Please enter a valid password").isLength({
      min: 6
    })
  ],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array()
      });
    }

    const { email, password } = req.body;
    try {
      let user = await User.findOne({
        email
      });
      if (!user)
        return res.status(400).json({
          message: "User Not Exist"
        });

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch)
        return res.status(400).json({
          message: "Incorrect Password !"
        });

      const payload = {
        user: {
          id: user.id,
          alpha: user.alpha,
          communityCode: user.communityCode,
          name: user.name
        }
      };

      jwt.sign(
        payload,
        "randomString",
        {
          expiresIn: 36000
        },
        (err, token) => {
          if (err) throw err;
          res.status(200).json({
            token
          });
        }
      );
    } catch (e) {
      console.error(e);
      res.status(500).json({
        message: "Server Error"
      });
    }
  }
);

router.put(
    "/makeAlpha/:id",
    function (req, res) {
      var conditions = {_id: req.params.id};
      User.update(conditions, req.body).then(doc => {
          if (!doc) {return res.status(404).end();}
          return res.status(200).json(doc);
      })
      .catch(err => next(err));
    }
  );

router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json(user);
  } catch (e) {
    res.send({ message: "Error in Fetching user" });
  }
});

router.get("/isAlpha", auth, async (req, res) => {
    try {
      const user = await User.find({_id:req.user.id},{alpha:1});
      res.json(user);
    }
    catch (e) {
      res.send({ message: "Error in Fetching user" });
    }
  });

module.exports = router;
