const request = require("supertest");
const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();

const cartRouter = require("../routes/Cart"); // make sure routes are set correctly
const Cart = require("../models/Cart");

const app = express();
app.use(express.json());
app.use("/cart", cartRouter);

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

describe("Cart API Integration Tests", () => {
  let cartId;
  let userId = new mongoose.Types.ObjectId();
  let productId = new mongoose.Types.ObjectId();

  test("should create a cart item", async () => {
    const res = await request(app).post("/cart").send({
      user: userId,
      product: productId,
      quantity: 2,
    });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("_id");
    expect(res.body.user).toBe(userId.toString());
    expect(res.body.quantity).toBe(2);
    cartId = res.body._id;
  });

  test("should get cart items by user ID", async () => {
    const res = await request(app).get(`/cart/user/${userId}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].user).toBe(userId.toString());
  });

  test("should update cart item by ID", async () => {
    const res = await request(app).put(`/cart/${cartId}`).send({
      quantity: 5,
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.quantity).toBe(5);
  });

  test("should delete cart item by ID", async () => {
    const res = await request(app).delete(`/cart/${cartId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body._id).toBe(cartId);
  });

  test("should delete all cart items by user ID", async () => {
    // First, add another item for this user
    await request(app).post("/cart").send({
      user: userId,
      product: productId,
      quantity: 1,
    });

    const res = await request(app).delete(`/cart/user/${userId}`);
    expect(res.statusCode).toBe(204);

    // Ensure no cart items left for this user
    const check = await request(app).get(`/cart/user/${userId}`);
    expect(check.body.length).toBe(0);
  });
});
