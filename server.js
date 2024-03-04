const express = require("express");
const bodyParser = require("body-parser"); // latest version of exressJS now comes with Body-Parser!
const bcrypt = require("bcrypt-nodejs");
const cors = require("cors");
const knex = require("knex");
require("dotenv").config();

const register = require("./controllers/register");
const signin = require("./controllers/signin");
const profile = require("./controllers/profile");
const image = require("./controllers/image");
const auth = require("./middleware/authorization");

const db = knex({
	// connect to your own database here:
	client: "pg",
	// connection: {
	// 	host: process.env.POSTGRES_HOST,
	// 	port: process.env.POSTGRES_PORT,
	// 	user: process.env.POSTGRES_USER,
	// 	password: process.env.POSTGRES_PASSWORD,
	// 	database: process.env.POSTGRES_DB,
	// },
	connection: process.env.POSTGRES_CONNECTION,
});

db.raw("SELECT 1")
	.then(() => {
		console.log("PostgreSQL connected");
	})
	.catch((e) => {
		console.log("PostgreSQL not connected");
		console.error(e);
	});

const app = express();

app.use(cors());
app.use(express.json()); // latest version of exressJS now comes with Body-Parser!

app.get("/", (req, res) => {
	res.send(db.users);
});
app.post("/signin", signin.signinAuthentication(db, bcrypt));
app.post("/register", (req, res) => {
	register.handleRegister(req, res, db, bcrypt);
});
app.get("/profile/:id", auth.requireAuth, (req, res) => {
	profile.handleProfileGet(req, res, db);
});
app.post("/profile/:id", auth.requireAuth, (req, res) => {
	profile.handleProfileUpdate(req, res, db);
});
app.put("/image", auth.requireAuth, (req, res) => {
	image.handleImage(req, res, db);
});
app.post("/imageurl", auth.requireAuth, (req, res) => {
	image.handleApiCall(req, res);
});

app.listen(3000, () => {
	console.log("app is running on port 3000");
});
