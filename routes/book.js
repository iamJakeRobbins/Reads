var express = require('express');
var router = express.Router();
const knex = require('../db/knex')

// functions

function mapAuthorsToBooks(records){
    var mappedBooks = records.reduce(function(mappedBooks, currentRecord){
        currentRecord = reassignBookIdToId(currentRecord);
        var bookId = currentRecord.id

        var author = extractAuthorFromRecord(currentRecord);
        currentRecord = deleteAuthorFromRecord(currentRecord);

        if (!mappedBooks.hasOwnProperty(bookId)){
            currentRecord.authors = [author];
            mappedBooks[bookId] = currentRecord;
        } else {
            mappedBooks[bookId].authors.push(author);
        }

        return mappedBooks;
    }, {});

    var books = [];
    for (var bookId in mappedBooks){
        books.push(mappedBooks[bookId]);
    }
    return books;
}
function reassignBookIdToId(record){
    record.id = record.book_id;
    delete record.book_id;
    return record;
}
function extractAuthorFromRecord(record){
    return {
        id: record.author_id,
        first_name: record.first_name,
        last_name: record.last_name,
        biography: record.biography,
        portrait_url: record.portrait_url
    };
}

function deleteAuthorFromRecord(record){
    var properties = [
        "author_id", "first_name", "last_name", "biography", "portrait_url"
    ];

    for (var i = 0, length = properties.length; i < length; i++){
        delete record[properties[i]];
    }

    return record;
}


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


router.get("/", function(request, response, next) {
    knex("book")
        .select()
        .innerJoin("book_author", "book.id", "book_id")
        .innerJoin("author", "author_id", "author.id")
    .then(function(records){
        var books = mapAuthorsToBooks(records);
        response.render("books/allbooks", {book: books, layout: "layout_books"});
    });
});

// GET delete book page
router.get('/:id/deleteBook', (req,res) => {
	const id = req.params.id;
	knex('book')
	.select()
	.where('id', id)
	.first()
	.then(book =>{
		console.log(book);
	res.render('books/deleteBook', {layout: "layout_books", book})
})
})

// GET add book page
router.get('/new', (req, res) =>{
	res.render('books/newBook',
{layout: "layout_books"})
})

// GET edit book page
router.get('/:id/editBook', (req,res) => {
	const id = req.params.id;
	knex('book')
	.select()
	.where('id', id)
	.first()
	.then(book =>{
	res.render('books/editBook', {layout: "layout_books", book})
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
		res.render('books/singleBook',{layout: "layout_books", book})
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
