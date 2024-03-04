const redisClient = require("../controllers/signin").redisClient;

const requireAuth = async (req, res, next) => {
	const { authorization } = req.headers;
	const token = authorization.split(" ")[1];

	if (!token || token === "null") {
		return res.status(401).json("Unauthorized");
	}

	try {
		await redisClient.get(token);
		next();
	} catch (err) {
		return res.status(401).json("Unauthorized");
	}
};

module.exports = {
	requireAuth,
};
