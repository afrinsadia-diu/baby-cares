/** @format */

const express = require('express')
const { MongoClient } = require('mongodb')
require('dotenv').config()
const cors = require('cors')
const ObjectId = require('mongodb').ObjectId
const admin = require('firebase-admin')
const cloudinary = require('cloudinary').v2
const fileupload = require('express-fileupload')

// cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})

//this is firebase configaration
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)

//firebase initializeApp
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
})
const app = express()
const port = process.env.PORT

//file upload middleware
app.use(fileupload({ useTempFiles: true }))

// middleware
app.use(
  cors({
    origin: `${process.env.FRONTEND_URL}`
  })
)

app.use(express.json())

//verifyToken middleware
async function verifyToken(req, res, next) {
  if (req.headers?.authorization?.startsWith('Bearer ')) {
    const token = req.headers.authorization.split(' ')[1]

    try {
      const decodedUser = await admin.auth().verifyIdToken(token)
      req.decodedEmail = decodedUser.email
    } catch {}
  }
  next()
}
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.CLUSTER}/${process.env.DB_NAME}?retryWrites=true&w=majority`

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})

async function run() {
  try {
    await client.connect()
    const database = client.db(`${process.env.DB_NAME}`)
    const usersCollection = database.collection('users')
    const productsCollection = database.collection('products')
    const orderCollection = database.collection('orders')
    const reviewCollection = database.collection('reviews')

    // create a product
    app.post('/product', verifyToken, async (req, res) => {
      const product = req.body
      const requester = req.decodedEmail
      if (requester) {
        if (requester === req.headers.email) {
          const result = await productsCollection.insertOne(product)
          res.json(result)
        }
      } else {
        res.status(401).json({ message: 'unauthorized' })
      }
    })

    //get all products
    app.get('/products', async (req, res) => {
      const cursor = productsCollection.find({})
      const products = await cursor.toArray()
      res.send(products)
    })

    // Delete products by admin
    app.delete('/product/:id', verifyToken, async (req, res) => {
      const requester = req.decodedEmail
      if (requester) {
        if (!req.headers.email && req.headers.email !== requester) {
          res.status(401).json({ message: 'unauthorized' })
        }

        const requesterAccount = await usersCollection.findOne({
          email: req.headers.email
        })
        console.log(requesterAccount)
        if (!requesterAccount) {
          res
            .status(403)
            .json({ message: 'you do not have to permission delete product' })
        }
        if (requesterAccount?.role === 'admin') {
          const id = req.params.id
          const query = { _id: ObjectId(id) }
          const result = await productsCollection.deleteOne(query)
          res.json(result)
        }
      } else {
        res.status(403).json({ message: 'unauthorized' })
      }
    })

    //create a new order
    app.post('/order', verifyToken, async (req, res) => {
      const order = req.body
      const status = 'Pending'
      const requester = req.decodedEmail
      if (requester) {
        if (!req.headers.email && req.headers.email !== requester) {
          res.status(401).json({ message: 'unauthorized' })
        }
        if (requester === req.headers.email) {
          let mergedObj = { status, ...order }
          const result = await orderCollection.insertOne(mergedObj)
          res.json(result)
        }
      } else {
        res.status(401).json({ message: 'unauthorized' })
      }
    })

    //get list of orders for admin
    app.get('/orders', verifyToken, async (req, res) => {
      const requester = req.decodedEmail
      if (requester) {
        if (!req.headers.email && req.headers.email !== req.decodedEmail) {
          res.status(401).json({ message: 'unauthorized' })
        }
        const requesterAccount = await usersCollection.findOne({
          email: req.headers.email
        })
        console.log(requesterAccount)
        if (!requesterAccount) {
          res
            .status(403)
            .json({ message: 'you do not have access to get orders' })
        }
        if (requesterAccount?.role === 'admin') {
          const cursor = orderCollection.find({})
          const orders = await cursor.toArray()
          res.send(orders)
        }
      } else {
        res.status(403).json({ message: 'unauthorized' })
      }
    })

    //get my orders
    app.get('/my-orders', verifyToken, async (req, res) => {
      const requester = req.decodedEmail
      if (requester) {
        if (!req.headers.email && req.headers.email !== requester) {
          res.status(401).json({ message: 'unauthorized' })
        }
        const cursor = orderCollection.find({ email: req.headers.email })
        const orders = await cursor.toArray()
        res.send(orders)
      } else {
        res.status(403).json({ message: 'unauthorized' })
      }
    })

    // Delete Order by user
    app.delete('/order/:id', verifyToken, async (req, res) => {
      const requester = req.decodedEmail
      if (requester) {
        if (!req.headers.email && req.headers.email !== requester) {
          res.status(401).json({ message: 'unauthorized' })
        }
        const id = req.params.id
        const query = { _id: ObjectId(id) }
        const result = await orderCollection.deleteOne(query)
        res.json(result)
      } else {
        res.status(403).json({ message: 'unauthorized' })
      }
    })

    //Update order by Admin
    app.put('/order/:id', verifyToken, async (req, res) => {
      const id = req.params.id
      const updatedUser = req.body
      const filter = { _id: ObjectId(id) }
      const requester = req.decodedEmail
      if (requester) {
        if (!req.headers.email && req.decodedEmail !== req.headers.email) {
          res.status(401).json({ message: 'unauthorized' })
        }
        const requesterAccount = await usersCollection.findOne({
          email: req.headers.email
        })
        if (!requesterAccount) {
          res
            .status(403)
            .json({ message: 'you do not have permission to update order' })
        }
        if (requesterAccount?.role === 'admin') {
          const chckStatus = await orderCollection.findOne(filter)
          if (chckStatus.status === 'Pending') {
            const options = { upsert: true }
            const status = 'shipped'
            const updateOrderStatus = {
              $set: {
                status: status
              }
            }
            const result = await orderCollection.updateOne(
              filter,
              updateOrderStatus,
              options
            )
            res.json(result)
          } else {
            const options = { upsert: true }
            const status = 'Pending'
            const updateOrderStatus = {
              $set: {
                status: status
              }
            }
            const result = await orderCollection.updateOne(
              filter,
              updateOrderStatus,
              options
            )
            res.json(result)
          }
        }
      } else {
        res.status(403).json({ message: 'unauthorized' })
      }
    })

    //make user
    app.post('/users', async (req, res) => {
      const user = req.body
      const result = await usersCollection.insertOne(user)
      console.log(result)
      res.json(result)
    })
    //if not user then add new user
    app.put('/users', async (req, res) => {
      const user = req.body
      const filter = { email: user.email }
      const options = { upsert: true }
      const updateDoc = { $set: user }
      const result = await usersCollection.updateOne(filter, updateDoc, options)
      res.json(result)
    })

    //check admin
    app.get('/users/:email', async (req, res) => {
      const email = req.params.email
      const query = { email: email }
      const user = await usersCollection.findOne(query)
      let isAdmin = false
      if (user?.role === 'admin') {
        isAdmin = true
      }
      res.json({ admin: isAdmin })
    })

    //make admin
    app.post('/users/admin', verifyToken, async (req, res) => {
      const user = req.body
      const requester = req.decodedEmail
      if (requester) {
        const requesterAccount = await usersCollection.findOne({
          email: requester
        })
        if (requesterAccount?.role === 'admin') {
          const result = await usersCollection.insertOne({
            ...user,
            role: 'admin'
          })
          res.json(result)
        }
      } else {
        res
          .status(403)
          .json({ message: 'you do not have access to make admin' })
      }
    })

    // create a review
    app.post('/review', verifyToken, async (req, res) => {
      const review = req.body
      const requester = req.decodedEmail
      if (requester) {
        if (requester === req.headers.email) {
          const result = await reviewCollection.insertOne(review)
          res.json(result)
        }
      } else {
        res.status(401).json({ message: 'unauthorized' })
      }
    })

    //get all reviews
    app.get('/reviews', async (req, res) => {
      const cursor = reviewCollection.find({})
      const reviews = await cursor.toArray()
      res.send(reviews)
    })

    // product image upload by Admin
    app.post('/image-upload', verifyToken, async (req, res) => {
      // collected image from data
      const file = req.files.file
      const requester = req.decodedEmail
      if (requester) {
        const requesterAccount = await usersCollection.findOne({
          email: requester
        })
        if (requesterAccount?.role === 'admin') {
          cloudinary.uploader.upload(file.tempFilePath, function (err, result) {
            res.send({ success: true, result: result })
          })
        }
      } else {
        res
          .status(403)
          .json({ message: 'you do not have access to make admin' })
      }
    })
  } finally {
    // await client.close()
  }
}
run().catch(console.dir)

app.get('/', async (req, res) => {
  await client.connect()
  res.send('Server Already Connect With Database')
})

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`)
})
