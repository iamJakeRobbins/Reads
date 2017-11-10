var express = require('express');
var router = express.Router();
const knex = require('../db/knex')

// GET home page for authors
router.get('/', (req, res) =>{
	knex('author')
	.select()
	.then((authorData)=> {
  res.render('authors/allAuthors', {author:authorData});
	})
});



module.exports = router;
