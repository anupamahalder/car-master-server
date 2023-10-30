const express = require('express');
const cors = require('cors');
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const port = process.env.PORT || 5000;
require('dotenv').config();
//middleware
app.use(cors());
app.use(express.json());

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

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    // create collection for service data 
    const serviceCollection = client.db('carmaster').collection('serviceData');
    // create collection to store service booking data 
    const bookingCollection = client.db('carmaster').collection('bookingData');


    // create api to fetch data 
    app.get('/services',async(req, res)=>{
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
    // read data from bookings 
    app.get('/bookings', async(req, res)=>{
      const cursor = bookingCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    })

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);
