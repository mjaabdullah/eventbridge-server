import cors from "cors";
import dotenv from "dotenv";
import express, { Request, Response } from "express";
import {
  Db,
  Filter,
  MongoClient,
  ObjectId,
  ServerApiVersion,
  Sort,
} from "mongodb";

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

interface EventData {
  id: ObjectId;
  title: string;
  shortDescription: string;
  description: string;
  category: string;
  location: string;
  eventDate: string;
  eventTime: string;
  ticketPrice: number;
  organizerName: string;
  image: string;
  createdBy: string;
  createdAt: string;
}

let db: Db;

const run = async (): Promise<void> => {
  try {
    // await client.connect(); // comment for production

    db = client.db("EventBridge");

    const events = db.collection<EventData>("events");

    app.get("/api/events", async (req: Request, res: Response) => {
      try {
        // Pagination
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 6;
        const skip = (page - 1) * limit;

        // Search & Filter
        const search = (req.query.search as string)?.trim();
        const category = req.query.category as string;
        const location = req.query.location as string;
        const sort = req.query.sort as string;

        // Query
        const query: Filter<EventData> = {};

        // Search by Event Title
        if (search) {
          query.title = {
            $regex: search,
            $options: "i",
          };
        }

        // Filter by Category
        if (category) {
          query.category = {
            $regex: category,
            $options: "i",
          };
        }

        // Filter by Location
        if (location) {
          query.location = {
            $regex: location,
            $options: "i",
          };
        }

        // Sort
        let sortOption: Sort = {};

        switch (sort) {
          case "date_desc":
            sortOption = { eventDate: -1 };
            break;

          case "price_asc":
            sortOption = { ticketPrice: 1 };
            break;

          case "price_desc":
            sortOption = { ticketPrice: -1 };
            break;

          default:
            sortOption = { createdAt: -1 };
        }

        const total = await events.countDocuments(query);

        const result = await events
          .find(query)
          .sort(sortOption)
          .skip(skip)
          .limit(limit)
          .toArray();

        res.status(200).json({
          success: true,
          data: result,
          pagination: {
            total,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            limit,
            hasNextPage: page < Math.ceil(total / limit),
            hasPrevPage: page > 1,
          },
        });
      } catch (error) {
        console.error(error);

        res.status(500).json({
          success: false,
          message: "Failed to fetch events.",
        });
      }
    });

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
