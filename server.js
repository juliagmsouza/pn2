const bodyParser = require('body-parser')
require('dotenv').config()
const express = require('express')
const cors = require('cors');
const path = require('path')
const app = express()
app.use(cors())
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/app', express.static(path.join(__dirname, '/public')))
let port = process.env.PORT || 3000
const knex = require('knex')({
    client: 'pg',
    debug: true,
    connection: {
        host: 'oregon-postgres.render.com',
        port: 5432,
        user: 'julia_souza',
        password: 'XIwfTa8wfkiS3RigCpT4fbcaRIHdFXrm',
        database: 'taylor_swift_albums_db',
        ssl: { rejectUnauthorized: false },
    }
});
app.get('/albums', (req, res) => {
    knex.select('*').from('albums')
        .then(albums => res.status(200).json(albums))
        .catch(err => {
            res.status(500).json({
                message: 'Erro ao recuperar albums - ' + err.message
            })
        })
})

app.post('/album', bodyParser.json(), (req, res) => {
    const album = {
        name: req.body.name,
        year: req.body.year,
        valor: req.body.valor,
    }
    knex('albums').returning('id').insert(album)
    .then(id => res.status(201).json(id))
    .catch(err => {
        res.status(500).json({
            message: 'Erro ao inserir album - ' + err.message
        })
    })
})

app.get('/album/:id', (req, res) => {
    const id = Number(req.params.id)
    knex.select('*').from('albums').where('id', id)
        .then(album => res.status(200).json(album))
        .catch(err => {
            res.status(500).json({
                message: 'Erro ao recuperar album - ' + err.message
            })
        })
})

app.put('/album/:id', bodyParser.json(), (req, res) => {
    const id = Number(req.params.id)
    const album = {
        name: req.body.name,
        year: req.body.year,
        valor: req.body.valor,
    }
    knex('albums').where('id', id).update(album)
        .then(album => res.status(200).json(album))
        .catch(err => {
            res.status(500).json({
                message: 'Erro ao atualizar album - ' + err.message
            })
        })
})

app.delete('/album/:id', (req, res) => {
    const id = Number(req.params.id)
    knex('albums').where('id', id).del()
        .then(album => res.status(200).json(album))
        .catch(err => {
            res.status(500).json({
                message: 'Erro ao deletar album - ' + err.message
            })
        })
})

app.listen(port) 