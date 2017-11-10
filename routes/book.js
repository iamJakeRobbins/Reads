var express = require('express');
var router = express.Router();
const knex = require('../db/knex')

// functions

function validId(id) {
  return !isNaN(id);
}

// function validEntry(book){
// 	return typeof book.title == 'string' &&
// 		book.title.trim() != ''
// }
//
// function validator(req,res,callback){
// 	if(validEntry(req.body)){
// 		const book = {
// 			title: req.body.title,
// 			genre: req.body.genre,
// 			cover: req.body.cover,
// 			description: req.body.description,
// 		};
// 		callback(book);
// } else {
// 	res.status(500)
// 	res.render('error', {
// 		message: 'that aint a real book fella'
// 	})
// }
// }
//

/* GET home page. */
router.get('/', (req, res) =>{
	knex('book')
	.select()
	.then((bookData)=> {
  res.render('books/allbooks', {book:bookData});
	})
});

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

// POST new book to database
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
