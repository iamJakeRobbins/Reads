var express = require('express');
var router = express.Router();
const knex = require('../db/knex')

/* GET home page. */
router.get('/', (req, res) =>{
	knex('book')
	.select()
	.then((bookData)=> {
  res.render('allbooks', {book:bookData});
	})
});

module.exports = router;
