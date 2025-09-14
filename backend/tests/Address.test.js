
const request = require("supertest");
const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();

const addressRouter = require("../routes/Address"); // ensure correct path
const Address = require("../models/Address");

const app = express();
app.use(express.json());
app.use("/address", addressRouter);

beforeAll(async () => {
  await mongoose.connect(
    process.env.MONGO_URI_TEST || "mongodb://127.0.0.1:27017/testdb",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  );
});

afterAll(async () => {
  await mongoose.connection.db.dropDatabase();
  await mongoose.connection.close();
});

describe("Address API Integration Tests", () => {
  let addressId;
  let userId = new mongoose.Types.ObjectId();

  test("should create a new address", async () => {
    const res = await request(app).post("/address").send({
      user: userId,
      street: "123 Test Street",
      city: "Test City",
      state: "TS",
      postalCode: "12345",
      country: "Testland",
    });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("_id");
    expect(res.body.user).toBe(userId.toString());
    expect(res.body.city).toBe("Test City");
    addressId = res.body._id;
  });

  test("should get addresses by user ID", async () => {
    const res = await request(app).get(`/address/user/${userId}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].user).toBe(userId.toString());
  });

  test("should update an address by ID", async () => {
    const res = await request(app).put(`/address/${addressId}`).send({
      city: "Updated City",
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.city).toBe("Updated City");
  });

  test("should delete an address by ID", async () => {
    const res = await request(app).delete(`/address/${addressId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body._id).toBe(addressId);
  });
});
