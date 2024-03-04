const jwt = require("jsonwebtoken");

// Redis Setup
const redis = require("redis");
// You will want to update your host to the proper address in production
const redisClient = redis.createClient({ url: process.env.REDIS_CONNECTION });
async function redisConnect() {
	return await redisClient.connect();
}
redisConnect();

const handleSignin = (db, bcrypt, req, res) => {
	const { email, password } = req.body;
	if (!email || !password) {
		return Promise.reject("incorrect form submission");
	}
	return (
		db
			.select("email", "hash")
			.from("login")
			.where("email", "=", email)
			//check user
			.then((data) => {
				//check password
				const isValid = bcrypt.compareSync(password, data[0].hash);
				if (isValid) {
					return db
						.select("*")
						.from("users")
						.where("email", "=", email)
						.then((user) => user[0])
						.catch((err) => Promise.reject("unable to get user"));
				} else {
					return Promise.reject("wrong credentials!");
				}
			})
			.catch((err) => Promise.reject("wrong credentials!"))
	);
};

const getAuthTokenId = async (req, res) => {
	const { authorization } = req.headers;
	const token = authorization.split(" ")[1];
	try {
		const tokenId = await redisClient.get(token);
		return res.json({ id: tokenId });
	} catch (err) {
		return res.status(400).json("Unauthorized");
	}
};

const signToken = (email) => {
	const jwtPayload = { email };
	return jwt.sign(jwtPayload, process.env.JWT_SECRET, {
		expiresIn: "2 days",
	});
};

const setToken = (key, value) => {
	return Promise.resolve(redisClient.set(key, value));
};

const createSession = (user) => {
	//JWT token and return user data
	const { email, id } = user;
	const token = signToken(email);
	return setToken(token, id)
		.then(() => {
			return { success: "true", userId: id, token: token };
		})
		.catch((err) => {
			console.log("error", err);
			err;
		});
};

const signinAuthentication = (db, bcrypt) => (req, res) => {
	const { authorization } = req.headers;

	//if have header, get token id, else call signin function
	return authorization
		? getAuthTokenId(req, res)
		: handleSignin(db, bcrypt, req, res)
				.then((data) => {
					return data.id && data.email ? createSession(data) : Promise.reject(data);
				})
				.then((session) => res.json(session))
				.catch((err) => res.status(400).json(err));
};

module.exports = {
	signinAuthentication: signinAuthentication,
	redisClient: redisClient,
};
