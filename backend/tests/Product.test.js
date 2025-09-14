const request = require("supertest");
const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();

const productRouter = require("../routes/Product"); // your existing product routes
const Product = require("../models/Product");

const app = express();
app.use(express.json());
app.use("/products", productRouter);

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

describe("Product API Integration Tests", () => {
  let productId;

  test("should create a new product", async () => {
    const res = await request(app).post("/products").send({
      name: "Test Product",
      brand: "66e4e6a1f1b7c4d6a1234567", // replace with valid ObjectId from your DB if needed
      category: "66e4e6a1f1b7c4d6a7654321",
      price: 100,
      isDeleted: false,
    });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("_id");
    expect(res.body.name).toBe("Test Product");
    productId = res.body._id;
  });

  test("should get all products", async () => {
    const res = await request(app).get("/products");
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.headers).toHaveProperty("x-total-count");
  });

  test("should get product by ID", async () => {
    const res = await request(app).get(`/products/${productId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("_id", productId);
  });

  test("should update product by ID", async () => {
    const res = await request(app).put(`/products/${productId}`).send({
      name: "Updated Product",
      price: 200,
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.name).toBe("Updated Product");
    expect(res.body.price).toBe(200);
  });

  test("should soft-delete product by ID", async () => {
    const res = await request(app).delete(`/products/${productId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.isDeleted).toBe(true);
  });

  test("should restore (undelete) product by ID", async () => {
    const res = await request(app).patch(`/products/${productId}/undelete`);
    expect(res.statusCode).toBe(200);
    expect(res.body.isDeleted).toBe(false);
  });
});
