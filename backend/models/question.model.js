var Promise = require('bluebird');
var mongoose = require('mongoose');
var httpStatus = require('http-status');
var APIError = require('../helpers/APIError');
var config = require('../config/config');

mongoose.connect('mongodb://' + config.mongo.host + ':' + config.mongo.port);

/**
 * Question Schema
 */
const QuestionSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    mainField: {
        type: String,
        required: false
    },
    subField: {
        type: String,
        required: false
    },
    createdAt: {
        type: Date,
        required: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SkyCherryUser',
        required: true
    },
    answers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Answer',
        required: false
    }],
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Like',
        required: false
    }],
    occupation: {
        type: String,
        required: false
    },
    familyType: {
        type: String,
        required: false
    },
    interest: {
        type: String,
        required: false
    },
    montlyIncome: {
        type: String,
        required: false
    },
    assets: {
        type: String,
        required: false
    },
    incomeManagement: {
        type: String,
        required: false
    },
    tags: [{
        type: String,
        required: false
    }]
});

/**
 * Methods
 */
QuestionSchema.method({
});

/**
 * Statics
 */
QuestionSchema.statics = {
    /**
     * @param {number} skip - Number of question to be skipped.
     * @param {number} limit - Limit number of question to be returned.
     * @returns {Promise<Question[]>}
     */
    list({ skip = 0, limit = 50, q = {} } = {}) {
      return this.find(q)
        .populate('createdBy')
        .sort({ createdAt: -1 })
        .skip(+skip)
        .limit(+limit)
        .exec();
    },
  
    /**
     * Get question
     * @param {ObjectId} id - The ObjectId of question.
     * @returns {Promise<Question, APIError>}
     */
    get(id) {
      return this.aggregate([
            {
                $match: { 
                    _id: mongoose.Types.ObjectId(id) 
                } 
            },
            { 
                $lookup: { 
                    from: 'skycherryusers', 
                    localField: 'createdBy', 
                    foreignField: '_id', 
                    as: 'createdBy' 
                }
            },
            { 
                $lookup: { 
                    from: 'answers', 
                    localField: '_id', 
                    foreignField: 'question', 
                    as: 'answers' 
                }
            },
            { 
                $lookup: { 
                    from: 'skycherryusers', 
                    localField: 'answers.createdBy', 
                    foreignField: '_id', 
                    as: 'answerUser' 
                }
            }
        ])
        .exec()
        .then((question) => {
            if (question.length == 1) {
                if ( question[0].answers.length > 0) {
                    question[0].answers.forEach(function(answer, index) {
                        answer.createdBy = question[0].answerUser[index];
                    });
                }
                delete question[0].answerUser;
                return question[0];
            }
            const err = new APIError('No such question exists!', httpStatus.NOT_FOUND);
            return Promise.reject(err);
        });
    }
};

/**
 * @typedef Question
 */
module.exports = mongoose.model('Question', QuestionSchema);
