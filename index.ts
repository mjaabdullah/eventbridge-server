import cors from "cors";
import dotenv from "dotenv";
import express, { Request, Response } from "express";
import { Db, MongoClient, ServerApiVersion } from "mongodb";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const port: string | number = process.env.PORT || 5000;
const uri: string = process.env.MONGO_URI || "";

const client: MongoClient = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let db: Db;

const run = async (): Promise<void> => {
  try {
    // await client.connect(); // comment for production

    db = client.db("EventBridge");

    // await client.db("admin").command({ ping: 1 }); // comment for production
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!",
    );
  } catch (error) {
    console.error("Database connection error:", error);
  }
};
run().catch(console.dir);

app.get("/", (req: Request, res: Response) => {
  res.send("Hello EventBridge-server!");
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
