import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import mongoose from 'mongoose'
import bcrypt from 'bcrypt-nodejs'
import User from './models/User'

const mongoUrl = process.env.MONGO_URL || "mongodb://localhost/authAPI"
mongoose.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true })
mongoose.Promise = Promise

const port = process.env.PORT || 8080
const app = express()

// Reset User database
if (process.env.RESET_DATABASE) {

  const deleteDatabase = async () => {
      await User.deleteMany();
      console.log(`Deleting User databse`)
  };
  deleteDatabase();
}

// Authenticator function, later used on line 57 to only accept authorized user to the enpoint example.
const authenticateUser = async (req, res, next) =>{
  const user = await User.findOne({accessToken: req.header('Authorization')})
  if(user){
    req.user = user
    next()
  } else {
    res.status(403).json({message: 'permission denied' ,loggetOut: true})
  }
}

app.use(cors())
app.use(bodyParser.json())

// Start defining your routes here
app.get('/', (req, res) => {
  res.send('')
})

// Registration endpoint using name, email and password to create user.
app.post('/users', async (req, res) => {
  try {
    const { name, email, password } = req.body
    const user = new User({ name, email, password: bcrypt.hashSync(password) })
    const saved = await user.save()

    res.status(201).json({ userId: saved._id, accessToken: saved.accessToken })
  } catch(err) {
    res.status(401).json({ message: 'Could not create user', errors:err.errors})
  }
})

// Example of checking if user is already authenticated
app.get('/secrets', authenticateUser)
app.get('/secrets', async (req, res) => {
  res.json({ message: 'Super secret endpoint with your accesstoken and user id!' })
})

// Validate user trying to log in. if username and password is correct it will respond with userid and accesstoken for frontend to use later
app.post('/sessions', async (req, res) => {
  const user = await User.findOne({ email: req.body.email })

  if(user && bcrypt.compareSync(req.body.password, user.password)) {
    res.json({ userId: user._id, accessToken: user.accessToken })
  } else {
    res.json({ message: "User not found", notFound: true})
  }
})

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`)
})
