const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
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

let checkToken = (req, res, next) => {
    let authToken = req.headers["authorization"]
    if (!authToken) {
        res.status(401).json({ message: 'Token de acesso requerida' })
    }
    else {
        let token = authToken.split(' ')[1]
        req.token = token
    }
    jwt.verify(req.token, process.env.SECRET_KEY, (err, decodeToken) => {
        if (err) {
            res.status(401).json({ message: 'Acesso negado' })
            return
        }
        req.userId = decodeToken.id
        next()
    })
}

let isAdmin = (req, res, next) => {
    knex
        .select('*').from('user').where({ id: req.userId })
        .then((users) => {
            if (users.length) {
                let user = users[0]
                let roles = user.roles.split(';')
                let adminRole = roles.find(i => i === 'ADMIN')
                if (adminRole === 'ADMIN') {
                    next()
                    return
                }
                else {
                    res.status(403).json({ message: 'Role de ADMIN requerida' })
                    return
                }
            }
        })
        .catch(err => {
            res.status(500).json({
                message: 'Erro ao verificar roles de usuário - ' + err.message
            })
        })
}

app.get('/albums', checkToken, (req, res) => {
    knex.select('*').from('albums')
        .then(albums => res.status(200).json(albums))
        .catch(err => {
            res.status(500).json({
                message: 'Erro ao recuperar albums - ' + err.message
            })
        })
})

app.post('/album', bodyParser.json(), checkToken, isAdmin, (req, res) => {
    const album = {
        name: req.body.name,
        year: req.body.year,
        valor: req.body.valor,
        recorder: req.body.recorder,
        tracks: req.body.tracks,
    }
    knex('albums').returning('id').insert(album)
        .then(id => res.status(201).json(id))
        .catch(err => {
            res.status(500).json({
                message: 'Erro ao inserir album - ' + err.message
            })
        })
})

app.get('/album/:id', checkToken, (req, res) => {
    const id = Number(req.params.id)
    knex.select('*').from('albums').where('id', id)
        .then(album => res.status(200).json(album))
        .catch(err => {
            res.status(500).json({
                message: 'Erro ao recuperar album - ' + err.message
            })
        })
})

app.put('/album/:id', bodyParser.json(), checkToken, isAdmin, (req, res) => {
    const id = Number(req.params.id)
    const album = {
        name: req.body.name,
        year: req.body.year,
        valor: req.body.valor,
        recorder: req.body.recorder,
        tracks: req.body.tracks,
    }
    knex('albums').where('id', id).update(album)
        .then(album => res.status(200).json(album))
        .catch(err => {
            res.status(500).json({
                message: 'Erro ao atualizar album - ' + err.message
            })
        })
})

app.delete('/album/:id', checkToken, isAdmin, (req, res) => {
    const id = Number(req.params.id)
    knex('albums').where('id', id).del()
        .then(album => res.status(200).json(album))
        .catch(err => {
            res.status(500).json({
                message: 'Erro ao deletar album - ' + err.message
            })
        })
})



app.post('/security/register', (req, res) => {
    knex('users')
        .insert({
            name: req.body.name,
            login: req.body.login,
            password: bcrypt.hashSync(req.body.password, 8),
            email: req.body.email
        }, ['id'])
        .then((result) => {
            let user = result[0]
            res.status(200).json({ "id": user.id })
            return
        })
        .catch(err => {
            res.status(500).json({
                message: 'Erro ao registrar usuario - ' + err.message
            })
        })
})

app.post('/security/login', (req, res) => {
    knex
        .select('*').from('users').where({ login: req.body.login })
        .then(users => {
            if (users.length) {
                let user = users[0]
                let checkPassword = bcrypt.compareSync(req.body.password, user.password)
                if (checkPassword) {
                    var tokenJWT = jwt.sign({ id: user.id },
                        process.env.SECRET_KEY, {
                        expiresIn: 3600
                    })
                    res.status(200).json({
                        id: user.id,
                        login: user.login,
                        name: user.name,
                        roles: user.roles,
                        token: tokenJWT
                    })
                    return
                }
            }
            res.status(200).json({ message: 'Login ou senha incorretos' })
        })
        .catch(err => {
            res.status(500).json({
                message: 'Erro ao verificar login - ' + err.message
            })
        })
})
app.listen(port)

