const Joi = require('joi');

module.exports.listingSchema = Joi.object({
    title: Joi.string().required(),
    description: Joi.string().required(),
    location: Joi.string().required(),
    price: Joi.number().required().min(0),
    country: Joi.string().required(),
    category: Joi.string().valid('Trending', 'Iconic City', 'Amazing Pools', 'Beach', 'Amazing Views', 'Cabins', 'Lakefront', 'Mountain', 'Castles', 'Camping', 'Farms', 'Arctic').optional(),
    image: Joi.any().optional()
});

module.exports.reviewSchema = Joi.object({
    review: Joi.object({
        comment: Joi.string().required(),
        rating: Joi.number().required().min(1).max(5)
    }).required()
});
