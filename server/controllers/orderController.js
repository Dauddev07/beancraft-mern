import mongoose from "mongoose";
import { Order } from "../models/Order.js";
import { Product } from "../models/Product.js";

/** POST /api/orders — authenticated; increments product.numberOfOrders by line qty */
export async function createOrder(req, res) {
  const { items, paymentMethod, total } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: "items array is required." });
  }

  if (!paymentMethod) {
    return res.status(400).json({ message: "paymentMethod is required." });
  }

  const normalized = [];

  for (const line of items) {
    const { productId, name, qty, price, image } = line;

    if (!productId || !name || qty === undefined || price === undefined) {
      return res.status(400).json({
        message: "Each item needs productId, name, qty, and price.",
      });
    }

    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({ message: "Invalid productId in cart." });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(400).json({ message: `Product not found: ${productId}` });
    }

    if (product.stockStatus === "out_of_stock") {
      return res.status(400).json({
        message: `${product.name} is out of stock.`,
      });
    }

    normalized.push({
      product: productId,
      name: String(name),
      qty: Number(qty),
      price: Number(price),
      image: image ? String(image) : product.image,
    });
  }

  const order = await Order.create({
    user: req.user.id,
    items: normalized,
    paymentMethod: String(paymentMethod),
    total: Number(total),
    status: "pending",
  });

  // Bump order counts for best-seller ranking
  for (const line of normalized) {
    await Product.findByIdAndUpdate(line.product, {
      $inc: { numberOfOrders: line.qty },
    });
  }

  res.status(201).json({
    id: order._id.toString(),
    items: order.items,
    paymentMethod: order.paymentMethod,
    total: order.total,
    createdAt: order.createdAt,
  });
}

/** GET /api/orders/my */
export async function myOrders(req, res) {
  const orders = await Order.find({ user: req.user.id })
    .sort({ createdAt: -1 })
    .lean();

  res.json(
    orders.map((o) => ({
      id: String(o._id),
      items: o.items,
      paymentMethod: o.paymentMethod,
      total: o.total,
      status: o.status,
      createdAt: o.createdAt,
      cancelReason: o.cancelReason || "",
      cancelledAt: o.cancelledAt,
      cancelledBy: o.cancelledBy,
      deliveredAt: o.deliveredAt,
      acceptedAt: o.acceptedAt,
    })),
  );
}

/** GET /api/orders/all — admin; excludes orders removed from dashboard */
export async function allOrders(_req, res) {
  const orders = await Order.find({ hiddenFromAdmin: { $ne: true } })
    .populate("user", "name email")
    .sort({ createdAt: -1 })
    .lean();

  res.json(
    orders.map((o) => ({
      id: String(o._id),
      user: o.user,
      items: o.items,
      paymentMethod: o.paymentMethod,
      total: o.total,
      status: o.status,
      createdAt: o.createdAt,
      cancelReason: o.cancelReason || "",
      cancelledAt: o.cancelledAt,
      cancelledBy: o.cancelledBy,
      deliveredAt: o.deliveredAt,
      acceptedAt: o.acceptedAt,
    })),
  );
}

const ADMIN_CANCEL_MESSAGE =
  "This order was cancelled by the shop for operational reasons. Contact us if you have questions.";

/** PATCH /api/orders/:id/accept — admin; customer can no longer cancel */
export async function acceptOrder(req, res) {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: "Invalid order id." });
  }

  const order = await Order.findById(id);
  if (!order) {
    return res.status(404).json({ message: "Order not found." });
  }

  if (order.hiddenFromAdmin) {
    return res.status(404).json({ message: "Order not found." });
  }

  if (order.status === "cancelled") {
    return res.status(400).json({ message: "Cancelled orders cannot be accepted." });
  }

  if (order.status === "fulfilled") {
    return res.status(400).json({ message: "Delivered orders are already complete." });
  }

  if (order.status !== "pending" && order.status !== "paid") {
    return res.status(400).json({ message: "This order cannot be accepted." });
  }

  if (order.acceptedAt) {
    return res.json({
      id: order._id.toString(),
      acceptedAt: order.acceptedAt,
    });
  }

  order.acceptedAt = new Date();
  await order.save();

  res.json({
    id: order._id.toString(),
    acceptedAt: order.acceptedAt,
  });
}

/** PATCH /api/orders/:id/deliver — admin; marks fulfilled / delivered for the customer */
export async function markOrderDelivered(req, res) {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: "Invalid order id." });
  }

  const order = await Order.findById(id);
  if (!order) {
    return res.status(404).json({ message: "Order not found." });
  }

  if (order.hiddenFromAdmin) {
    return res.status(404).json({ message: "Order not found." });
  }

  if (order.status === "cancelled") {
    return res.status(400).json({ message: "Cancelled orders cannot be marked as delivered." });
  }

  if (order.status === "fulfilled") {
    return res.json({
      id: order._id.toString(),
      status: order.status,
      deliveredAt: order.deliveredAt,
    });
  }

  if (order.status !== "pending" && order.status !== "paid") {
    return res.status(400).json({ message: "This order cannot be marked as delivered." });
  }

  order.status = "fulfilled";
  order.deliveredAt = new Date();
  await order.save();

  res.json({
    id: order._id.toString(),
    status: order.status,
    deliveredAt: order.deliveredAt,
  });
}

/** PATCH /api/orders/:id/cancel — owner only; pending orders */
export async function cancelMyOrder(req, res) {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: "Invalid order id." });
  }

  const order = await Order.findById(id);
  if (!order) {
    return res.status(404).json({ message: "Order not found." });
  }

  if (String(order.user) !== String(req.user.id)) {
    return res.status(403).json({ message: "Not your order." });
  }

  if (order.status === "cancelled") {
    return res.status(400).json({ message: "This order is already cancelled." });
  }

  if (order.acceptedAt) {
    return res.status(400).json({
      message: "The shop has accepted this order. It can no longer be cancelled from your profile.",
    });
  }

  if (order.status !== "pending") {
    return res.status(400).json({
      message: "Only pending orders can be cancelled from your profile.",
    });
  }

  order.status = "cancelled";
  order.cancelReason = "You cancelled this order from your profile.";
  order.cancelledBy = "user";
  order.cancelledAt = new Date();
  await order.save();

  res.json({
    id: order._id.toString(),
    items: order.items,
    paymentMethod: order.paymentMethod,
    total: order.total,
    status: order.status,
    createdAt: order.createdAt,
    cancelReason: order.cancelReason,
    cancelledAt: order.cancelledAt,
    cancelledBy: order.cancelledBy,
  });
}

/** DELETE /api/orders/:id — admin only; hides from admin dashboard, customer sees cancelled */
export async function deleteOrder(req, res) {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: "Invalid order id." });
  }

  const order = await Order.findById(id);
  if (!order) {
    return res.status(404).json({ message: "Order not found." });
  }

  if (order.hiddenFromAdmin) {
    return res.status(404).json({ message: "Order not found." });
  }

  if (order.status === "fulfilled") {
    return res.status(400).json({
      message: "Delivered orders cannot be removed. They stay visible for your records.",
    });
  }

  if (order.status === "cancelled" && order.cancelledBy === "user") {
    order.hiddenFromAdmin = true;
    await order.save();
    res.status(204).send();
    return;
  }

  order.status = "cancelled";
  order.cancelReason = ADMIN_CANCEL_MESSAGE;
  order.cancelledBy = "admin";
  order.cancelledAt = new Date();
  order.hiddenFromAdmin = true;
  await order.save();

  res.status(204).send();
}
