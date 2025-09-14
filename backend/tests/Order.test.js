const request = require("supertest");
const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();

const orderRouter = require("../routes/Order"); // make sure you have routes defined for orders
const Order = require("../models/Order");

const app = express();
app.use(express.json());
app.use("/orders", orderRouter);

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI_TEST || "mongodb://127.0.0.1:27017/testdb", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

afterAll(async () => {
  await mongoose.connection.db.dropDatabase();
  await mongoose.connection.close();
});

describe("Order API Integration Tests", () => {
  let orderId;
  let userId = new mongoose.Types.ObjectId();

  test("should create a new order", async () => {
    const res = await request(app).post("/orders").send({
      user: userId,
      items: [{ product: new mongoose.Types.ObjectId(), quantity: 2 }],
      totalPrice: 500,
      status: "pending",
    });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("_id");
    expect(res.body.totalPrice).toBe(500);
    orderId = res.body._id;
  });

  test("should get all orders", async () => {
    const res = await request(app).get("/orders");
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.headers).toHaveProperty("x-total-count");
  });

  test("should get orders by user ID", async () => {
    const res = await request(app).get(`/orders/user/${userId}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].user).toBe(userId.toString());
  });

  test("should update order by ID", async () => {
    const res = await request(app).put(`/orders/${orderId}`).send({
      status: "shipped",
      totalPrice: 600,
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe("shipped");
    expect(res.body.totalPrice).toBe(600);
  });
});
