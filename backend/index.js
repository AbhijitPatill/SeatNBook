require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const authRoutes = require("./routes/authRoutes");
const venueRoutes = require("./routes/venueRoutes");
const eventRoutes = require("./routes/eventRoutes");
const showRoutes = require("./routes/showRoutes");
const { startExpiryListener } = require("./services/expiryListener");

const seatRoutes = require("./routes/seatRoutes");

const bookingRoutes = require("./routes/bookingRoutes");

const reportRoutes = require("./routes/reportRoutes");

const waitlistRoutes = require("./routes/waitlistRoutes");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/venues", venueRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/shows", showRoutes);
app.use("/api/auth", authRoutes);

app.use("/api/shows", seatRoutes);

app.use("/api/bookings", bookingRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/waitlist", waitlistRoutes);

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("join_show", (showId) => {
    socket.join(`show:${showId}`);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

app.set("io", io);

startExpiryListener(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});