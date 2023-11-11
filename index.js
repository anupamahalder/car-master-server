const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const port = process.env.PORT || 5050;
require('dotenv').config();
//middleware
app.use(cors({
  origin: ['http://localhost:5173'],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// run server on root 
app.get('/',(req, res)=>{
    res.send('Car Master server is running!');
})

app.listen(port,()=>{
    console.log(`Car Master is running on port: ${port}`);
})

// adding mongodb atlas 

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.xtkbbr3.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// create our own middlewares (to create middleware we need three things: req, res, next)
// we can use this middleware at multiple places 
const logger = async(req, res, next) =>{
  console.log('called:', req.hostname, req.originalUrl)
  next();
}; 
// another middleware it will be used where we want some security
const verifyToken = async(req, res, next) =>{
  // in this middleware we want to get the token (in req.cookies there can be token or not)
  const token = req.cookies?.token;
  console.log('Value of token inside middleware:',token);
  // if token is not there then return with a message and status
  if(!token){
    return res.status(401).send({message: 'not authorized'});
  }
  // verify the token (token, secret, callback function)
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded)=>{
    // error 
    if(err){
      console.log(err);
      return res.status(401).send({message: 'unauthorized'});
    }
    // if token is valid then it will be decoded and go to next 
    console.log('value in the token', decoded);
    // set the user info in any thing req.user and instead of user we can write anything
    req.user = decoded;
    next();
  })
}

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    // create collection for service data 
    const serviceCollection = client.db('carmaster').collection('serviceData');
    // create collection to store service booking data 
    const bookingCollection = client.db('carmaster').collection('bookingData');

    // ------------------------------Auth related api--------------------------
    // here we put our looger middleware after the url and when this url hit it will go to this middleware
    app.post('/jwt', async(req, res)=>{
      // get data 
      const user = req.body;
      console.log(user);
      // create a jwt sign 
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1h'});
      res
      .cookie('token', token, {
        httpOnly: true,
        secure: false, //for localhost 
        sameSite: 'none'
      })
      .send({success: true});
    })


    // app.post('/jwt',logger, async(req, res)=>{
    //   const user = req.body;
    //   console.log(user);
    //   // sign(payload, secret, options(expired time))
    //   const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1h'});
    //   // set cookies 
    //   res
    //   .cookie('token', token,{
    //     httpOnly: true,
    //     secure: false,
    //   })
    //   .send({success: true});
    // })

    // ---------------------------Services related api-------------------------
    // create api to fetch data 
    app.get('/services', logger ,async(req, res)=>{
        const cursor = serviceCollection.find();
        const result = await cursor.toArray();
        res.send(result);
    })
    // create api to get a specific service from database 
    app.get('/services/:id', async(req, res)=>{
        const id = req.params.id;
        const query = {_id: new ObjectId(id)};
        // const options = {
        //   // if we want some property then write 1 else 0 and by default _id will be provided 
        //   projection: {title: 1, price: 1, img:1 ,service_id:1},
        // };
        // const result = await serviceCollection.findOne(query,options);
        const result = await serviceCollection.findOne(query);
        res.send(result);
    })
    // ---------------------Bookings service-------------------------
    // create a api to post/create data and store to database 
    app.post('/bookings', async(req, res)=>{
      // get data from req.body 
      const booking = req.body;
      // console.log(booking);
      const result = await bookingCollection.insertOne(booking);
      res.send(result);
    })
    // read all data from bookings conditionally from query
    app.get('/bookings', logger, verifyToken, async(req, res)=>{
      console.log(req.query.email);
      console.log('Token coming->',req.cookies.token);
      console.log('User in the valid token', req.user);
      // if user and requesting data for someone matches then only user gets data else one user cannot get other user's data 
      if(req.query.email !== req.user.email){
        return res.status(403).send({message: 'forbidden access'});
      }
      // empty object 
      let query = {};
      if(req.query?.email){
        // filter based on email 
        query = {email: req.query.email}
      }
      const cursor = bookingCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    })
    // read a specific data from bookings data 
    app.get('/bookings/:id', async(req, res)=>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const result = await bookingCollection.findOne(query);
      res.send(result);
    })
    // create delete api to delete bookings by id 
    app.delete('/bookings/:id', async(req, res)=>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const result = await bookingCollection.deleteOne(query);
      res.send(result);
    })
    // update booking 
    app.patch('/bookings/:id', async(req, res)=>{
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)};
      const updateBooking = req.body;
      const updatedDoc = {
        $set:{
          status: updateBooking.status
        },
      };
      console.log("update booking",updateBooking);
      const result = await bookingCollection.updateOne(filter, updatedDoc);
      res.send(result);
    })

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);
