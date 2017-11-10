var express = require('express');
var router = express.Router();
const knex = require('../db/knex')

// functions

function validId(id) {
  return !isNaN(id);
}

function validEntry(book){
	return typeof book.title == 'string' &&
		book.title.trim() != ''
}

function validator(req,res,callback){
	if(validEntry(req.body)){
		const book = {
			title: req.body.title,
			genre: req.body.genre,
			cover: req.body.cover,
			description: req.body.description,
		};
		callback(book);
} else {
	res.status(500)
	res.render('error', {
		message: 'that aint a real book fella'
	})
}
}


/* GET home page. */
router.get('/', (req, res) =>{
	knex('book')
	.select()
	.then((bookData)=> {
  res.render('books/allbooks', {book:bookData});
	})
});
// GET delete book page
router.get('/:id/deleteBook', (req,res) => {
	const id = req.params.id;
	knex('book')
	.select()
	.where('id', id)
	.first()
	.then(book =>{
	res.render('books/deleteBook', book)
})
})

// GET add book page
router.get('/new', (req, res) =>{
	res.render('books/newBook')
})

// GET edit book page
router.get('/:id/editBook', (req,res) => {
	const id = req.params.id;
	knex('book')
	.select()
	.where('id', id)
	.first()
	.then(book =>{
	res.render('books/editBook', book)
})
})

// GET single book page
router.get('/:id', (req,res) =>{
	const id = req.params.id;
	if (typeof id != 'undefined') {
		knex('book')
		.select()
		.where ('id', id)
		.first()
		.then(book => {
		res.render('books/singleBook', book)
	})
	}else {
		res.status(500)
		res.render('error', {
			message: 'invalid'
	})
}
})

// POST new book to database (includes validation)
router.post('/', (request ,response) =>{
		request.checkBody('title', 'Title is empty or too long').notEmpty().isLength({max: 255});
		request.checkBody('genre', 'Genre is empty or too long').notEmpty().isLength({max: 255});
		request.checkBody('description', 'Description is empty or too long').notEmpty().isLength({max: 2000});
		request.checkBody('cover', 'Cover not a URL').isUrl(request.body.cover);
		var errors = request.validationErrors();
			if (errors){
				response.render('error', {errors:errors});
			} else {
		knex('book')
		.insert({
			title: request.body.title,
			genre: request.body.genre,
			description: request.body.description,
			cover: request.body.cover
		})
		.then(() =>{
			response.redirect('/books')
			})
	}
})
// Update a book in the database (includes validation)
router.put('/:id', (request, response) =>{
	request.checkBody('title', 'Title is empty or too long').notEmpty().isLength({max: 255});
	request.checkBody('genre', 'Genre is empty or too long').notEmpty().isLength({max: 255});
	request.checkBody('description', 'Description is empty or too long').notEmpty().isLength({max: 2000});
	request.checkBody('cover', 'Cover not a URL').isUrl(request.body.cover);
	var errors = request.validationErrors();
		if (errors){
			response.render('error', {errors:errors});
		} else {
	knex('book')
	.where('id', request.params.id)
	.update({
		title: request.body.title,
		genre: request.body.genre,
		description: request.body.description,
		cover: request.body.cover
	}, 'id')
	.then(ids =>{
		const id = ids[0]
		response.redirect('/books')
	})
}
})

router.delete('/:id', (req, res) => {
  const id = req.params.id;
  if(validId(id)) {
    knex('book')
      .where('id', id)
      .del()
      .then(() => {
        res.redirect('/books');
      });
  } else {
    res.status( 500);
    res.render('error', {
      message:  'Invalid id'
    });
  }
});


module.exports = router;
