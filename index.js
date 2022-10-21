let express = require('express');
const nunjucks = require('nunjucks');
// Importamos y configuramos dotenv
require('dotenv').config();
let	app = express();

nunjucks.configure('views', {
  autoescape: true,
  express: app
});

app.use(express.json());
app.use(express.urlencoded({extended: false}));

const MongoClient = require('mongodb').MongoClient;
//const MONGO_URL = process.env.RUTAMONGO;
//const MONGO_URL = 'mongodb://localhost:27017/';
const MONGO_URL = process.env.RUTAMONGO;

app.get('/', (req, res)=>{	  
  MongoClient.connect(MONGO_URL,{ useUnifiedTopology: true }, (err, db) => {    
  const dbo = db.db(process.env.DATABASE);  
  // Por edad, de menor a mayor con 1. De mayor a menor con -1
  dbo.collection(process.env.COLECCION).find().sort({"titulo":1}).limit(20).toArray((err, series) => {	 
      // personajes tiene el array de todas las series del find     
      res.render('index.html',{data:series});
	})
});	
});

// Series individuales

app.get('/serie/:id', (req, res)=>{	  
    MongoClient.connect(MONGO_URL,{ useUnifiedTopology: true }, (err, db) => {  
    const dbo = db.db(process.env.DATABASE);  
    // Recibo el parámetro id de la URL y lo ubico en una variable id
    const id = parseInt(req.params.id);
    dbo.collection(process.env.COLECCION).findOne({"id":id}, function(err, data) {
        if (err) throw err;
        if(data){
            res.send(`<h1>${data.titulo}  (${data.year})</h1>
            <p>Genero: ${data.genero}</p>
            <p>Año: ${data.year}
            <p>Pais: ${data.pais}
            </p>
            <p><a href="/">Regresar a la Home</a></p>
            `);
        }
        else{
            res.send("No encontrado");
        }
        db.close();
        });
      });
  });	




// Buscador de personajes
app.get('/buscador', (req, res)=>{
  //Obtenemos el valor del término de búsqueda. El que viene luego de ?
  let termino = req.query.busqueda;  
  // Creamos la expresión regular para poder verificar que contenga el término el nombre en la base de datos. La i significa no sensible a may/min
  let expresiontermino = new RegExp(termino,"i");
  MongoClient.connect(MONGO_URL,{ useUnifiedTopology: true }, (err, db) => {  
  const dbo = db.db(process.env.DATABASE);    
  // Buscamos el término escrito por el usuario como expresión regular, comparando con el campo titulo de la colección
  dbo.collection(process.env.COLECCION).find({"titulo":{$regex: expresiontermino }}).toArray(function(err, data) {	      
      res.render('buscador.html',{termino:termino,data:data});
	});
});	
});	


// Alta de personajes
app.all('/alta', (req, res)=>{
  // Verificamos si están viniendo por POST datos del formulario. En ese caso hacemos el insertOne en la base de datos
  if(req.body.titulo && req.body.year && req.body.genero && req.body.pais)
  {
    MongoClient.connect(MONGO_URL,{ useUnifiedTopology: true }, (err, db) => {  
    const dbo = db.db(process.env.DATABASE)
    const d = new Date();
    const n = d.getTime()

    // Insertamos los campos que llegan del formulario:
    dbo.collection(process.env.COLECCION).insertOne(
        {
            titulo: req.body.titulo,
            year: parseInt(req.body.year),
            genero: req.body.genero,
            pais: req.body.pais,
            id: parseInt(n)
        },
        function (err, res) {
            db.close();
            if (err) {              
              //return console.log(err);    
              res.send("Error " + err);
            }
        })
        res.render('alta.html',{mensaje:"Alta exitosa de "+req.body.titulo});        
    })
  }
  else{
    // Ingresamos al formualario sin insertar datos
    res.render('alta.html');      
  }
})


// modificar titulo
app.get('/modificarTitulo', (req, res)=>{
  //Obtenemos el valor del término de búsqueda. El que viene luego de ?
  let termino = req.query.modificar;  
  // Creamos la expresión regular para poder verificar que contenga el término el nombre en la base de datos. La i significa no sensible a may/min
  let expresiontermino = new RegExp(termino,"i");
  MongoClient.connect(MONGO_URL,{ useUnifiedTopology: true }, (err, db) => {  
  const dbo = db.db(process.env.DATABASE);    
  // Buscamos el término escrito por el usuario como expresión regular, comparando con el campo titulo de la colección
  dbo.collection(process.env.COLECCION).find({"titulo":{$regex: expresiontermino }}).toArray(function(err, data) {	      
      res.render('modificarTitulo.html',{termino:termino,data:data});
	});
});	
});	



// Actualizar
app.all('/actualizar', (req, res)=>{
  // Verificamos que el campos hidden del elemento en el buscador esté llegando y también el campo edad del input type number del personaje
  if(req.body.titulo)
  {
    MongoClient.connect(MONGO_URL,{ useUnifiedTopology: true }, (err, db) => {  
    const dbo = db.db(process.env.DATABASE)
    // Buscamos en la colección que nombre coincida con el nombre que llega del formulario (del campo hidden) y le pasamos la edad del formulario req.body.edad como entero
    dbo.collection(process.env.COLECCION).updateOne(
      {titulo: req.body.titulo},{ $set: {newtitulo: toString(req.body.titulo)} },
        function (err, res) {
            db.close();
            if (err) {              
              res.send("Error " + err);
            }
        })
        res.render('actualizarTitulo.html',{titulo:req.body.titulo,newtitulo:req.body.titulo});        
    })
  }
  else{
    res.send('Error, no se ha podido actualizar el personaje');      
  }
})


// BUSCAR - BORRAR
app.get('/borrarDatos', (req, res)=>{
  
  let termino = req.query.busqueda;  
  // Creamos la expresión regular para poder verificar que contenga el término el nombre en la base de datos. La i significa no sensible a may/min
  let  expresiontermino = new RegExp(termino,"i");
  MongoClient.connect(MONGO_URL,{ useUnifiedTopology: true }, (err, db) => {  
  const dbo = db.db(process.env.DATABASE);    
  dbo.collection(process.env.COLECCION).find({"titulo":{$regex: expresiontermino }}).toArray(function(err, data) {	      
      res.render('borrarDatos.html',{termino:termino,data:data});
	});
});	
});	


// Borrar personaje
app.all('/borrar', (req, res)=>{
  // Verificamos que el campos hidden del elemento en el buscador esté llegando
  if(req.body.titulo)
  {
    MongoClient.connect(MONGO_URL,{ useUnifiedTopology: true }, (err, db) => {  
    const dbo = db.db(process.env.DATABASE)
    // Buscamos en la colección que nombre coincida con el nombre que llega del formulario (del campo hidden)
    dbo.collection(process.env.COLECCION).deleteOne(
        {titulo: req.body.titulo},
        function (err, res) {
            db.close();
            if (err) {              
              res.send("Error " + err);
            }
        })
        res.render('borrados.html',{titulo:req.body.titulo});        
    })
  }
  else{
    res.send('Error, no se ha podido eliminar el personaje');      
  }
})

app.listen(8080);