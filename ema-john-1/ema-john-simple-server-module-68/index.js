const express = require('express');
const cors = require('cors');
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.5z77za5.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res.status(401).send({ message: 'Unauthorized Access' })
  }
  const token = authorization.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).send({ message: "Forbidden Access" });
    }
    // req.decoded = decoded;
    next();
  });
}

async function run(){
    try{
      const productCollection = client.db("emaJohnDB").collection("products");

      app.post("/jwt", (req, res) => {
        const user = req.body;
        const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "1h" });
        res.send({ token });
      });

      app.get("/products", async (req, res) => {
        const page = parseInt(req.query.page);
        const size = parseInt(req.query.size);
        // console.log(page, size);
        const query = {};
        const cursor = productCollection.find(query);
        const products = await cursor
          .skip(page * size)
          .limit(size)
          .toArray();
        const count = await productCollection.estimatedDocumentCount();
        res.send({ count, products });
      });

      app.post("/productsByIds", verifyJWT, async (req, res) => {
        const ids = req.body;
        const objectIds = ids.map((id) => ObjectId(id));
        const query = { _id: { $in: objectIds } };
        const cursor = productCollection.find(query);
        const products = await cursor.toArray();
        res.send(products);
      });

      // Send a ping to confirm a successful connection
      await client.db("admin").command({ ping: 1 });
      console.log("Pinged your deployment. You successfully connected to MongoDB!");

    }
    finally{
      // Ensures that the client will close when you finish/error
      // await client.close();
    }
}

run().catch(err => console.error(err));

app.get('/', (req, res) =>{
    res.send('ema john server is running');
})

app.listen(port, () =>{
    console.log(`ema john running on: ${port}`)
})