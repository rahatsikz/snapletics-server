const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();

const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.htrvoxc.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

function verifyJWT(req, res, send) {
  const authHeaders = req.headers.authorization;
  if (!authHeaders) {
    return res.status(401).send({ message: "Unauthorized" });
  }
  const token = authHeaders.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
    if (err) {
      return res.status(401).send({ message: "Unauthorized" });
    }
    req.decoded = decoded;
    send();
  });
}

async function run() {
  try {
    const serviceCollection = client.db("Snapletics").collection("services");
    const reviewCollection = client.db("Snapletics").collection("reviews");

    app.post("/jwt", (req, res) => {
      const user = req.body;
      console.log(req.body);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "20m",
      });
      res.send({ token });
    });

    app.get("/servicebylimit", async (req, res) => {
      const query = {};
      const cursor = serviceCollection.find(query);
      const services = await cursor.limit(3).toArray();
      res.send(services);
    });
    app.get("/services", async (req, res) => {
      const query = {};
      const cursor = serviceCollection.find(query);
      const services = await cursor.toArray();
      res.send(services);
    });
    app.get("/services/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const selectedService = await serviceCollection.findOne(query);
      res.send(selectedService);
    });

    app.post("/services", async (req, res) => {
      const service = req.body;
      const result = await serviceCollection.insertOne(service);
      res.send(result);
    });

    app.get("/reviews/:id", async (req, res) => {
      const id = req.params.id;
      const query = { service: id };
      const cursor = reviewCollection.find(query);
      const review = await cursor.toArray();
      res.send(review);
    });
    app.get("/reviews", verifyJWT, async (req, res) => {
      const decoded = req.decoded;
      console.log(decoded);
      if (decoded.email !== req.query.email) {
        res.status(403).send({ message: "unauthorized" });
      }
      let query = {};
      if (req.query.email) {
        query = { email: req.query.email };
      }
      const cursor = reviewCollection.find(query);
      const review = await cursor.toArray();
      res.send(review);
    });

    app.post("/reviews", async (req, res) => {
      const review = req.body;
      const result = await reviewCollection.insertOne(review);
      res.send(result);
    });

    app.patch("/reviews/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const edited = req.body.edited;
      console.log(edited);
      const updateDoc = {
        $set: {
          review: edited,
        },
      };
      const result = await reviewCollection.updateOne(query, updateDoc);
      console.log(result);
      res.send(result);
    });

    app.delete("/reviews/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await reviewCollection.deleteOne(query);
      res.send(result);
    });
  } finally {
  }
}

run().catch((error) => console.error(error));

app.get("/", (req, res) => {
  res.send("Snapletics server running");
});

app.listen(port, () => {
  console.log(`capturing image on ${port}`);
});
