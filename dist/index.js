import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { MongoClient, ServerApiVersion, } from "mongodb";
dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
const port = process.env.PORT || 5000;
const uri = process.env.MONGO_URI || "";
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
});
let db;
const run = async () => {
    try {
        // await client.connect(); // comment for production
        db = client.db("EventBridge");
        const events = db.collection("events");
        app.get("/api/events", async (req, res) => {
            try {
                // Pagination
                const page = parseInt(req.query.page) || 1;
                const limit = parseInt(req.query.limit) || 6;
                const skip = (page - 1) * limit;
                // Search & Filter
                const search = req.query.search?.trim();
                const category = req.query.category;
                const location = req.query.location;
                const sort = req.query.sort;
                // Query
                const query = {};
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
                let sortOption = {};
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
            }
            catch (error) {
                console.error(error);
                res.status(500).json({
                    success: false,
                    message: "Failed to fetch events.",
                });
            }
        });
        // await client.db("admin").command({ ping: 1 }); // comment for production
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    }
    catch (error) {
        console.error("Database connection error:", error);
    }
};
run().catch(console.dir);
app.get("/", (req, res) => {
    res.send("Hello EventBridge-server!");
});
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
