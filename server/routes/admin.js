const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// const upload = require('../config/multer'); 
const multer = require("multer");
const { storage } = require('../cloudinary');
const upload = multer({ storage });

const adminLayout = '../views/layouts/admin';
const jwtSecret = process.env.JWT_SECRET;

/**
 * 
 * Check Login
*/
const authMiddleware = async(req, res, next ) => {
  const token = req.cookies.token;
  if(!token) {
    return res.redirect("/admin");
  }
  try {
    const decoded = jwt.verify(token, jwtSecret);
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.redirect("/admin");
    }
    req.user = user;
    res.locals.currentUser = user;
    next();
  } catch(error) {
    res.status(401).json( { message: 'Unauthorized'} );
  }
}


/**
 * GET /
 * Admin - Login Page
*/
router.get('/admin', async (req, res) => {
  try {
    const locals = {
      title: "Admin",
      description: "Simple Blog created with NodeJs, Express & MongoDb."
    }
    res.render('admin/index', { locals, layout: adminLayout });
  } catch (error) {
    console.log(error);
  }
});
//Register for admin
router.get('/register', async (req, res) => {
  try {
    const locals = {
      title: "Admin",
      description: "Simple Blog created with NodeJs, Express & MongoDb."
    }
    res.render('admin/register', { locals, layout: adminLayout });
  } catch (error) {
    console.log(error);
  }
});




/**
 * POST /
 * Admin - Check Login
*/
router.post('/admin', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne( { username } );
    if(!user) {
      return res.status(401).json( { message: 'Invalid credentials' } );
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    //const isPasswordValid = req.body.password === user.password;
    if(!isPasswordValid) {
      return res.status(401).json( { message: 'Invalid credentials' } );
    }
    const token = jwt.sign({ userId: user._id}, jwtSecret );
    res.cookie('token', token, { httpOnly: true });
    res.redirect('/dashboard');
  } catch (error) {
    console.log(error);
  }
});

/**
 * GET /
 * Admin Dashboard
*/
router.get('/dashboard', authMiddleware, async (req, res) => {
  try {
    const locals = {
      title: 'Dashboard',
      description: 'Simple Blog created with NodeJs, Express & MongoDb.'
    }
    const data = await Post.find({author:req.user._id}).populate("author");
    res.render('admin/dashboard', {
      locals,
      data,
      layout: adminLayout
    });
  } catch (error) {
    console.log(error);
  }

});


/**
 * GET /
 * Admin - Create New Post
*/
router.get('/add-post', authMiddleware, async (req, res) => {
  try {
    const locals = {
      title: 'Add Post',
      description: 'Simple Blog created with NodeJs, Express & MongoDb.'
    }
    res.render('admin/add-post', {
      locals,
      layout: adminLayout
    });
  } catch (error) {
    console.log(error);
  }

});

/**
 * POST /
 * Admin - Create New Post
*/
router.post('/add-post', authMiddleware,upload.single('image') ,async (req, res) => {
  try {
    try {
      const newPost = new Post({
        title: req.body.title,
        body: req.body.body,
        image:req.file.path,
        author:req.user._id
      });
      await Post.create(newPost);
      res.redirect('/dashboard');
    } catch (error) {
      console.log(error);
    }

  } catch (error) {
    console.log(error);
  }
});


/**
 * GET /
 * Admin - Create New Post
*/
router.get('/edit-post/:id', authMiddleware, async (req, res) => {
  try {
    const locals = {
      title: "Edit Post",
      description: "Free NodeJs User Management System",
    };
    const data = await Post.findOne({ _id: req.params.id });
    res.render('admin/edit-post', {
      locals,
      data,
      layout: adminLayout
    })
  } catch (error) {
    console.log(error);
  }

});


/**
 * PUT /
 * Admin - Create New Post
*/
router.put('/edit-post/:id', authMiddleware,upload.single('image'), async (req, res) => {
  try {
    const postdata= await Post.findById(req.params.id) 
    if(req.body.title){
      postdata.title=req.body.title
    }
    if(req.body.body){
      postdata.body=req.body.body
    }
    if(req.file){
      postdata.image=req.file.path
    }
    postdata.updatedAt= Date.now()
    await postdata.save()
    res.redirect(`/edit-post/${req.params.id}`);

  } catch (error) {
    console.log(error);
  }

});


// router.post('/admin', async (req, res) => {
//   try {
//     const { username, password } = req.body;
    
//     if(req.body.username === 'admin' && req.body.password === 'password') {
//       res.send('You are logged in.')
//     } else {
//       res.send('Wrong username or password');
//     }

//   } catch (error) {
//     console.log(error);
//   }
// });


/**
 * POST /
 * Admin - Register
*/
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
     const hashedPassword = await bcrypt.hash(password, 10);
    try {
      const user = await User.create({ username, password:hashedPassword });
      //const user = await User.create({ username, password:password });
      //res.status(201).json({ message: 'User Created', user });
      const token = jwt.sign({ userId: user._id}, jwtSecret );
      res.cookie('token', token, { httpOnly: true });
      return res.redirect("/");
    } catch (error) {
      return res.redirect("/");
    }
  } catch (error) {
    console.log(error);
    return res.redirect("/");
  }
});


/**
 * DELETE /
 * Admin - Delete Post
*/
router.delete('/delete-post/:id', authMiddleware, async (req, res) => {
  try {
    await Post.deleteOne( { _id: req.params.id } );
    res.redirect('/dashboard');
  } catch (error) {
    console.log(error);
  }

});


/**
 * GET /
 * Admin Logout
*/
router.get('/logout', (req, res) => {
  res.clearCookie('token');
  //res.json({ message: 'Logout successful.'});
  res.redirect('/');
});


module.exports = router;
