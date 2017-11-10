var express = require('express');
var router = express.Router();
const knex = require('../db/knex')

function validId(id) {
  return !isNaN(id);
}

function mapBooksToAuthors(records){
    var mappedAuthors = records.reduce(function(mappedAuthors, currentRecord){
        currentRecord = reassignAuthorIdToId(currentRecord);
        var authorId = currentRecord.id

        var book = extractBookFromRecord(currentRecord);
        currentRecord = deleteBookFromRecord(currentRecord);

        if (!mappedAuthors.hasOwnProperty(authorId)){
            currentRecord.books = [book];
            mappedAuthors[authorId] = currentRecord;
        } else {
            mappedAuthors[authorId].books.push(book);
        }

        return mappedAuthors;
    }, {});

    var authors = [];
    for (var authorId in mappedAuthors){
        authors.push(mappedAuthors[authorId]);
    }
    return authors;
}

function extractBookFromRecord(record){
    return {
        id: record.book_id,
        title: record.title,
        description: record.description,
        cover_url: record.cover_url,
        genre: record.genre
    };
}

function deleteBookFromRecord(record){
    var properties = [
        "book_id", "title", "genre", "description", "cover_url"
    ];

    for (var i = 0, length = properties.length; i < length; i++){
        delete record[properties[i]];
    }

    return record;
}

function reassignAuthorIdToId(record){
    record.id = record.author_id;
    delete record.author_id;
    return record;
}

// GET home page for authors
router.get("/", function(request, response, next) {
    knex("author")
        .select("*", "author.id AS author_id")
        .leftOuterJoin("book_author", "author.id", "author_id")
        .leftOuterJoin("book", "book_id", "book.id")
    .then(function(records){
        var authors = mapBooksToAuthors(records);
        response.render("authors/allAuthors", {layout: "layout_author", author: authors});
    });
});

router.get('/new', (req, res) =>{
	res.render('authors/newAuthor', {layout: "layout_author"})
})

router.get("/:id/editAuthor", function(request, response, next) {
    Promise.all([
        knex("author")
            .select("*", "author.id AS author_id")
            .leftOuterJoin("book_author", "author.id", "author_id")
            .leftOuterJoin("book", "book_id", "book.id")
            .where("author.id", request.params.id),
        knex("book").select()
    ]).then(function(results){
        var authors = mapBooksToAuthors(results[0]);
        response.render("authors/editAuthor", {layout: "layout_author", author: authors[0], books: results[1]});
    });
});

router.get("/:id/deleteAuthor", function(request, response, next) {
    knex("author")
        .select("*", "author.id AS author_id")
        .leftOuterJoin("book_author", "author.id", "author_id")
        .leftOuterJoin("book", "book_id", "book.id")
        .where("author.id", request.params.id)
    .then(function(authors){
        var authors = mapBooksToAuthors(authors);
        response.render("authors/deleteAuthor", {layout: "layout_author", author: authors[0]});
    });
});

// GET single author page
router.get("/:id", function(request, response, next) {
    knex("author")
        .select("*", "author.id AS author_id")
        .leftOuterJoin("book_author", "author.id", "author_id")
        .leftOuterJoin("book", "book_id", "book.id")
        .where("author.id", request.params.id)
    .then(function(authors){
        var authors = mapBooksToAuthors(authors);
        response.render("authors/singleAuthor", {layout: "layout_author", author: authors[0]});
    });
})


router.post("/", function(request, response, next) {
    request.checkBody("first_name", "First name is empty or too long").notEmpty().isLength({max: 255});
    request.checkBody("last_name", "Last name is empty or too long").notEmpty().isLength({max: 255});
    request.checkBody("biography", "Biography is too long").isLength({max: 10000});
    request.checkBody("portrait_url", "Not a URL").isUrl(request.body.portrait_url);

    var errors = request.validationErrors();
    if (errors){
        response.render("error", {errors: errors});
    } else {
        knex("author").insert({
            first_name: request.body.first_name,
            last_name: request.body.last_name,
            biography: request.body.biography,
            portrait_url: request.body.portrait_url
        }).then(function(){
            response.redirect('authors/allAuthors');
        });
    }
});


router.put("/:id", function(request, response, next) {
    request.checkBody("first_name", "First name is empty or too long").notEmpty().isLength({max: 255});
    request.checkBody("last_name", "Last name is empty or too long").notEmpty().isLength({max: 255});
    request.checkBody("biography", "Biography is too long").isLength({max: 10000});
    request.checkBody("portrait_url", "Not a URL").isUrl(request.body.portrait_url);

    var errors = request.validationErrors();
    if (errors){
        response.render("error", {errors: errors});
    } else {
        knex("author").update({
            first_name: request.body.first_name,
            last_name: request.body.last_name,
            biography: request.body.biography,
            portrait_url: request.body.portrait_url
        }).where("id", request.params.id).then(function(){
            response.redirect("/authors");
        });
    }
});

router.delete('/:id', (req, res) => {
  const id = req.params.id;
  if(validId(id)) {
    knex('author')
      .where('id', id)
      .del()
      .then(() => {
        res.redirect('/authors');
      });
  } else {
    res.status( 500);
    res.render('error', {
      message:  'Invalid id'
    });
  }
});

module.exports = router;
